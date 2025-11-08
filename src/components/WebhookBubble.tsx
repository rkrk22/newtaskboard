import { DragEvent, useEffect, useRef, useState } from "react";
import spriteSheet from "@/assets/sprite_animation_small_2.png";
import CharacterSprite from "@/components/CharacterSprite";
import { Loader2 } from "lucide-react";
import { TASK_DRAG_TYPE } from "@/lib/dragTypes";

export default function WebhookBubble() {
  const [text, setText] = useState("");
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropTargetActive, setIsDropTargetActive] = useState(false);

  // Храним один активный таймер скрытия баббла
  const hideTimerRef = useRef<number | null>(null);

  // Чистим таймер при размонтировании
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, []);

  const restartHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => {
      setIsBubbleVisible(false);
      hideTimerRef.current = null;
    }, 12000);
  };

  const handleCharacterClick = async () => {
    if (isLoading) return;                // защита от даблклика во время загрузки
    setIsLoading(true);
    try {
      const res = await fetch("https://n8n-my35.onrender.com/webhook/assistant-bubble");
      if (!res.ok) throw new Error("Ошибка запроса");
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        setText(data.message || data.text || JSON.stringify(data));
      } else {
        const t = await res.text();
        setText(t.trim() || "");
      }
      setIsLoading(false);

      // показываем баббл и перезапускаем 12с-таймер
      setIsBubbleVisible(true);
      restartHideTimer();
    } catch (e) {
      console.error(e);
      setText("");
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Character */}
      <div
        className={`fixed left-12 bottom-4 z-50 cursor-pointer transition duration-200 ${
          isDropTargetActive ? "scale-110 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" : ""
        }`}
        onClick={handleCharacterClick}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes(TASK_DRAG_TYPE)) {
            event.preventDefault();
          }
        }}
        onDragEnter={(event: DragEvent<HTMLDivElement>) => {
          if (event.dataTransfer.types.includes(TASK_DRAG_TYPE)) {
            event.preventDefault();
            setIsDropTargetActive(true);
          }
        }}
        onDragLeave={() => setIsDropTargetActive(false)}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          if (!event.dataTransfer.types.includes(TASK_DRAG_TYPE)) {
            return;
          }
          event.preventDefault();
          setIsDropTargetActive(false);
          setText("Well done!");
          setIsBubbleVisible(true);
          restartHideTimer();
        }}
      >
        <CharacterSprite
          src={spriteSheet}
          frameW={267}
          frameH={272}
          frames={9}
          columns={3}
          height={120}
          playing={isBubbleVisible || isLoading}
        />
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed left-12 bottom-32 z-50">
          <div className="rounded-full border border-border bg-card p-3 shadow-lg">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </div>
      )}

      {/* Bubble */}
      {isBubbleVisible && !isLoading && (
        <div className="fixed left-12 bottom-32 z-50 max-w-[240px]">
          <div
            className="relative rounded-2xl border border-border bg-card p-3 text-foreground shadow-lg"
            style={{ wordWrap: "break-word" }}
          >
            {text}
            <div
              className="absolute -bottom-2 left-4 h-0 w-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px]"
              style={{ borderTopColor: "hsl(var(--card))" }}
            />
          </div>
        </div>
      )}
    </>
  );
}
