"use client";

import { useEffect } from "react";

export default function DisableContextMenu() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Проверяем, является ли элемент полем ввода или текстовым блоком
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      
      // Если это не инпут, блокируем системное меню
      if (!isInput) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return null;
}