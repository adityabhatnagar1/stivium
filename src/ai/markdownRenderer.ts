import * as smd from "streaming-markdown";
import DOMPurify from "dompurify";
import type * as monacoNs from "monaco-editor";
import { resolveColorizeLanguage } from "./verilogMonarch";

// A from-scratch `smd.Renderer` implementation (see
// node_modules/streaming-markdown/smd.d.ts) rather than
// `smd.default_renderer()`. The default renderer is a fine reference for
// the token→element mapping and the append-only `nodes[index]` stack
// trick, but its output has no Stivium classes, no code-block chrome
// (language label / copy button), and no syntax highlighting hook — all
// of which this feature explicitly requires. Every DOM node here is
// built with `document.createElement` / `document.createTextNode`, the
// same way `default_add_text` does, so — like the default renderer —
// model output never passes through `innerHTML`. The one place that
// changes is `colorizeCodeBlock` below, which *does* set `innerHTML`
// (Monaco's `colorize()` returns an HTML string) and is therefore the
// one place `DOMPurify.sanitize` is used, restricted to the handful of
// tags/attrs syntax highlighting actually produces.

type RendererData = {
  nodes: (HTMLElement | Element)[];
  typeStack: smd.Token[];
  index: number;
  colorize: (code: string, lang: string) => Promise<string | null>;
};

function normalizeLangLabel(lang: string): string {
  const trimmed = lang.trim();
  return trimmed.length > 0 ? trimmed : "text";
}

async function colorizeCodeBlock(
  codeEl: HTMLElement,
  colorize: RendererData["colorize"],
): Promise<void> {
  // The message (or the whole panel) may have unmounted, or this
  // particular code block may belong to a superseded/replaced render,
  // by the time the async colorize call resolves. Checking `isConnected`
  // both before and after the await is the cheap, correct guard against
  // writing into a detached node — no AbortController plumbing needed
  // for what is a pure, side-effect-free DOM read + write.
  if (!codeEl.isConnected) return;

  const lang = codeEl.dataset.lang ?? "";
  const source = codeEl.textContent ?? "";
  if (!source.trim()) return;

  const html = await colorize(source, lang);
  if (!html || !codeEl.isConnected) return;

  const safeHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["span", "br"],
    ALLOWED_ATTR: ["class", "style"],
  });
  codeEl.innerHTML = safeHtml;
  codeEl.closest(".stv-code-block")?.classList.add("stv-code-block--lit");
}

function buildCodeBlockSlot(parent: Element): {
  parent: Element;
  slot: HTMLElement;
} {
  const wrapper = document.createElement("div");
  wrapper.className = "stv-code-block";

  const header = document.createElement("div");
  header.className = "stv-code-block__header";

  const langLabel = document.createElement("span");
  langLabel.className = "stv-code-block__lang";
  langLabel.textContent = "text";
  header.appendChild(langLabel);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "stv-code-block__copy";
  copyBtn.textContent = "Copy";
  header.appendChild(copyBtn);

  wrapper.appendChild(header);

  const pre = document.createElement("pre");
  pre.className = "stv-code-block__pre";
  wrapper.appendChild(pre);

  parent.appendChild(wrapper);

  const slot = document.createElement("code");
  slot.className = "stv-code-block__code";

  copyBtn.addEventListener("click", () => {
    const text = slot.textContent ?? "";
    void navigator.clipboard.writeText(text).then(
      () => {
        copyBtn.textContent = "Copied";
        window.setTimeout(() => {
          copyBtn.textContent = "Copy";
        }, 1400);
      },
      () => {
        copyBtn.textContent = "Copy failed";
        window.setTimeout(() => {
          copyBtn.textContent = "Copy";
        }, 1400);
      },
    );
  });

  return { parent: pre, slot };
}

/** Only allow href schemes that are inert to set as a static attribute;
 * `javascript:`/`data:` hrefs execute on click even though the anchor
 * itself was populated by our own trusted DOM-building code, because the
 * *value* of that href originated in model output. */
function isSafeHref(value: string): boolean {
  return /^(https?:|mailto:)/i.test(value.trim());
}

export function createStvMarkdownRenderer(
  root: HTMLElement,
  monaco: typeof monacoNs,
): smd.Renderer<RendererData> {
  const data: RendererData = {
    nodes: [root],
    typeStack: [],
    index: 0,
    colorize: (code, lang) => {
      const languageId = resolveColorizeLanguage(monaco, lang);
      return monaco.editor.colorize(code, languageId, { tabSize: 2 }).then(
        (html) => html,
        () => null,
      );
    },
  };

  const add_token: smd.Renderer<RendererData>["add_token"] = (d, type) => {
    let parent: Element = d.nodes[d.index];
    let slot: HTMLElement;

    switch (type) {
      case smd.Token.Document:
        return;
      case smd.Token.Paragraph:
        slot = document.createElement("p");
        slot.className = "stv-md-p";
        break;
      case smd.Token.Blockquote:
        slot = document.createElement("blockquote");
        slot.className = "stv-md-blockquote";
        break;
      case smd.Token.Heading_1:
      case smd.Token.Heading_2:
      case smd.Token.Heading_3:
      case smd.Token.Heading_4:
      case smd.Token.Heading_5:
      case smd.Token.Heading_6: {
        const level = smd.heading_to_level(type);
        slot = document.createElement(`h${Math.min(level + 3, 6)}`);
        slot.className = "stv-md-heading";
        break;
      }
      case smd.Token.Line_Break:
        slot = document.createElement("br");
        break;
      case smd.Token.Rule:
        slot = document.createElement("hr");
        slot.className = "stv-md-rule";
        break;
      case smd.Token.Italic_Ast:
      case smd.Token.Italic_Und:
        slot = document.createElement("em");
        break;
      case smd.Token.Strong_Ast:
      case smd.Token.Strong_Und:
        slot = document.createElement("strong");
        break;
      case smd.Token.Strike:
        slot = document.createElement("s");
        break;
      case smd.Token.Code_Inline:
        slot = document.createElement("code");
        slot.className = "stv-md-code-inline";
        break;
      case smd.Token.Raw_URL:
      case smd.Token.Link:
        slot = document.createElement("a");
        slot.className = "stv-md-link";
        (slot as HTMLAnchorElement).target = "_blank";
        (slot as HTMLAnchorElement).rel = "noopener noreferrer";
        break;
      case smd.Token.Image:
        // Deliberately not an <img>: rendering a model-supplied URL as
        // a live <img src> would make the app fetch an arbitrary
        // remote resource with zero user confirmation the moment a
        // response streams in. Represented as inert text instead.
        slot = document.createElement("span");
        slot.className = "stv-md-image-ref";
        break;
      case smd.Token.List_Unordered:
        slot = document.createElement("ul");
        slot.className = "stv-md-list";
        break;
      case smd.Token.List_Ordered:
        slot = document.createElement("ol");
        slot.className = "stv-md-list";
        break;
      case smd.Token.List_Item:
        slot = document.createElement("li");
        break;
      case smd.Token.Checkbox: {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.disabled = true;
        checkbox.className = "stv-md-checkbox";
        slot = checkbox;
        break;
      }
      case smd.Token.Code_Block:
      case smd.Token.Code_Fence: {
        const built = buildCodeBlockSlot(parent);
        parent = built.parent;
        slot = built.slot;
        break;
      }
      case smd.Token.Table:
        slot = document.createElement("table");
        slot.className = "stv-md-table";
        break;
      case smd.Token.Table_Row: {
        let sectionParent: Element;
        switch (parent.children.length) {
          case 0:
            sectionParent = parent.appendChild(document.createElement("thead"));
            break;
          case 1:
            sectionParent = parent.appendChild(document.createElement("tbody"));
            break;
          default:
            sectionParent = parent.children[1];
        }
        parent = sectionParent;
        slot = document.createElement("tr");
        break;
      }
      case smd.Token.Table_Cell:
        slot = document.createElement(
          parent.parentElement?.tagName === "THEAD" ? "th" : "td",
        );
        break;
      case smd.Token.Equation_Block:
      case smd.Token.Equation_Inline:
        slot = document.createElement("span");
        slot.className = "stv-md-code-inline";
        break;
      default:
        slot = document.createElement("span");
    }

    d.index += 1;
    d.nodes[d.index] = parent.appendChild(slot);
    d.typeStack[d.index] = type;
  };

  const end_token: smd.Renderer<RendererData>["end_token"] = (d) => {
    const closingNode = d.nodes[d.index];
    const closingType = d.typeStack[d.index];
    d.index -= 1;

    if (
      (closingType === smd.Token.Code_Block ||
        closingType === smd.Token.Code_Fence) &&
      closingNode instanceof HTMLElement
    ) {
      void colorizeCodeBlock(closingNode, d.colorize);
    }
  };

  const add_text: smd.Renderer<RendererData>["add_text"] = (d, text) => {
    d.nodes[d.index].appendChild(document.createTextNode(text));
  };

  const set_attr: smd.Renderer<RendererData>["set_attr"] = (d, type, value) => {
    const node = d.nodes[d.index];
    if (type === smd.Attr.Lang) {
      if (node instanceof HTMLElement) {
        const lang = normalizeLangLabel(value);
        node.dataset.lang = lang;
        const label = node
          .closest(".stv-code-block")
          ?.querySelector<HTMLElement>(".stv-code-block__lang");
        if (label) label.textContent = lang;
      }
      return;
    }
    if (type === smd.Attr.Href) {
      if (isSafeHref(value)) node.setAttribute("href", value);
      return;
    }
    node.setAttribute(smd.attr_to_html_attr(type), value);
  };

  return { data, add_token, end_token, add_text, set_attr };
}

export type StvMarkdownController = {
  /** Feed the next *delta* only — text already written must not be
   * passed again; the parser is incremental and stateful. */
  write: (deltaText: string) => void;
  /** Flush any buffered trailing text. Safe to call multiple times. */
  end: () => void;
};

export function createStvMarkdownController(
  root: HTMLElement,
  monaco: typeof monacoNs,
): StvMarkdownController {
  const renderer = createStvMarkdownRenderer(root, monaco);
  const parser = smd.parser(renderer);
  return {
    write: (deltaText: string) => {
      if (deltaText) smd.parser_write(parser, deltaText);
    },
    end: () => smd.parser_end(parser),
  };
}
