import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function ScriptInjector() {
  const { data } = useSiteSettings(["script_head", "script_body", "script_footer"]);

  useEffect(() => {
    if (!data) return;

    // Inject head scripts
    if (data.script_head) {
      const existing = document.getElementById("custom-head-scripts");
      if (existing) existing.remove();
      const container = document.createElement("div");
      container.id = "custom-head-scripts";
      container.innerHTML = data.script_head;
      // Move script tags to head properly
      const scripts = container.querySelectorAll("script");
      scripts.forEach((s) => {
        const newScript = document.createElement("script");
        if (s.src) newScript.src = s.src;
        else newScript.textContent = s.textContent;
        Array.from(s.attributes).forEach((attr) => {
          if (attr.name !== "src") newScript.setAttribute(attr.name, attr.value);
        });
        document.head.appendChild(newScript);
      });
      // Non-script elements (meta, link, etc.)
      const nonScripts = container.querySelectorAll(":not(script)");
      nonScripts.forEach((el) => document.head.appendChild(el.cloneNode(true)));
    }

    // Inject body scripts (top of body)
    if (data.script_body) {
      const existing = document.getElementById("custom-body-scripts");
      if (existing) existing.remove();
      const container = document.createElement("div");
      container.id = "custom-body-scripts";
      container.innerHTML = data.script_body;
      const scripts = container.querySelectorAll("script");
      scripts.forEach((s) => {
        const newScript = document.createElement("script");
        if (s.src) newScript.src = s.src;
        else newScript.textContent = s.textContent;
        Array.from(s.attributes).forEach((attr) => {
          if (attr.name !== "src") newScript.setAttribute(attr.name, attr.value);
        });
        document.body.insertBefore(newScript, document.body.firstChild);
      });
    }

    // Inject footer scripts (end of body)
    if (data.script_footer) {
      const existing = document.getElementById("custom-footer-scripts");
      if (existing) existing.remove();
      const container = document.createElement("div");
      container.id = "custom-footer-scripts";
      container.innerHTML = data.script_footer;
      const scripts = container.querySelectorAll("script");
      scripts.forEach((s) => {
        const newScript = document.createElement("script");
        if (s.src) newScript.src = s.src;
        else newScript.textContent = s.textContent;
        Array.from(s.attributes).forEach((attr) => {
          if (attr.name !== "src") newScript.setAttribute(attr.name, attr.value);
        });
        document.body.appendChild(newScript);
      });
    }
  }, [data]);

  return null;
}
