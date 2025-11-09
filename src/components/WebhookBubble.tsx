import { DragEvent, useEffect, useRef, useState } from "react";
import spriteSheet from "@/assets/sprite_animation_small_2.png";
import CharacterSprite from "@/components/CharacterSprite";
import { Loader2 } from "lucide-react";
import { TASK_DRAG_TYPE } from "@/lib/dragTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { dispatchTaskStatusChange } from "@/lib/events";

export default function WebhookBubble() {
  const [text, setText] = useState("");
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropTargetActive, setIsDropTargetActive] = useState(false);

  // Храним один активный таймер скрытия баббла
  const hideTimerRef = useRef<number | null>(null);
  const completionSoundRef = useRef<HTMLAudioElement | null>(null);

  // Чистим таймер при размонтировании
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      completionSoundRef.current?.pause();
      completionSoundRef.current = null;
    };
  }, []);

  useEffect(() => {
    completionSoundRef.current = new Audio("/sounds/task_done_sound.wav");
    completionSoundRef.current.preload = "auto";
  }, []);

  const playCompletionSound = () => {
    if (!completionSoundRef.current) return;
    completionSoundRef.current.currentTime = 0;
    completionSoundRef.current.play().catch(() => {
      // ignore playback errors (e.g., user gesture not satisfied)
    });
  };

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const restartHideTimer = () => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setIsBubbleVisible(false);
      hideTimerRef.current = null;
    }, 12000);
  };

  const celebrateCompletion = (message = "Well done!") => {
    setText(message);
    setIsBubbleVisible(true);
    restartHideTimer();
    playCompletionSound();
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

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(TASK_DRAG_TYPE)) {
      return;
    }

    event.preventDefault();
    setIsDropTargetActive(false);
    const taskId = event.dataTransfer.getData(TASK_DRAG_TYPE);

    if (!taskId) {
      toast.error("Не удалось определить задачу");
      return;
    }

    const previousBubbleState = {
      text,
      visible: isBubbleVisible,
    };

    celebrateCompletion();
    dispatchTaskStatusChange({ id: taskId, status: "done" });

    const { error } = await supabase
      .from("tasks")
      .update({ status: "done" })
      .eq("id", taskId);

    if (error) {
      console.error(error);
      toast.error("Не получилось закрыть задачу");
      dispatchTaskStatusChange({ id: taskId, status: "todo" });

      if (previousBubbleState.visible) {
        setText(previousBubbleState.text);
        setIsBubbleVisible(true);
        restartHideTimer();
      } else {
        clearHideTimer();
        setIsBubbleVisible(false);
        setText(previousBubbleState.text);
      }
      return;
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
        onDrop={handleDrop}
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
