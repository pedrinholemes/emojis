import Image, { ImageProps } from "next/image";
import { forwardRef } from "react";

import { EmojiName } from "./emojiNames";

import { cn } from "@/lib/utils";

interface EmojiProps
  extends Omit<ImageProps, "src" | "width" | "height" | "alt"> {
  emoji: EmojiName;
}

export const Emoji = forwardRef<HTMLImageElement, EmojiProps>(function Emoji(
  { emoji, className, ...props },
  ref
) {
  return (
    <Image
      src={`/emoji/72x72/${emoji}.png`}
      alt={`"${emoji} Emoji"`}
      width={72}
      height={72}
      className={cn("w-[1em] h-[1em] inline-block align-[-.1em]", className)}
      ref={ref}
      {...props}
    />
  );
});
