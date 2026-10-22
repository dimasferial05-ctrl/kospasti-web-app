"use client";

import React, { useSyncExternalStore } from "react";
import Image, { ImageProps } from "next/image";
import { useTheme } from "next-themes";

export interface ThemeImageProps extends Omit<ImageProps, "src"> {
  srcLight: string;
  srcDark: string;
}

const emptySubscribe = () => () => {};

export function ThemeImage({
  srcLight,
  srcDark,
  alt,
  className = "",
  ...rest
}: ThemeImageProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Sebelum mounted (SSR & hidrasi awal), gunakan srcLight sebagai fallback stabil
  const isDark = mounted && resolvedTheme === "dark";
  const activeSrc = isDark ? srcDark : srcLight;

  return (
    <Image
      {...rest}
      src={activeSrc}
      alt={alt}
      className={className}
    />
  );
}

export default ThemeImage;
