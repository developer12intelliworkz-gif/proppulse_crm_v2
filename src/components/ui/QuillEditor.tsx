import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const DEFAULT_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

export interface QuillEditorProps {
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  modules?: Record<string, unknown>;
  className?: string;
}

/** Quill via ref (avoids react-quill findDOMNode deprecation warning). */
export default function QuillEditor({
  value,
  onChange,
  readOnly = false,
  placeholder,
  modules = DEFAULT_MODULES,
  className,
}: QuillEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  onChangeRef.current = onChange;
  valueRef.current = value;

  useEffect(() => {
    if (!hostRef.current || quillRef.current) return;

    const mount = document.createElement("div");
    hostRef.current.appendChild(mount);

    const quill = new Quill(mount, {
      theme: "snow",
      modules,
      placeholder,
      readOnly,
    });

    quill.root.innerHTML = valueRef.current || "";
    quillRef.current = quill;

    quill.on("text-change", () => {
      const html = quill.root.innerHTML;
      if (html !== valueRef.current) {
        onChangeRef.current(html);
      }
    });

    return () => {
      quillRef.current = null;
      hostRef.current?.replaceChildren();
    };
  }, [modules, placeholder]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const html = value || "";
    if (quill.root.innerHTML !== html) {
      quill.root.innerHTML = html;
    }
  }, [value]);

  useEffect(() => {
    quillRef.current?.enable(!readOnly);
  }, [readOnly]);

  return <div ref={hostRef} className={className} />;
}
