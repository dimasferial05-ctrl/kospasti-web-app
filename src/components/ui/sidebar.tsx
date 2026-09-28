"use client";

import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-3 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "260px" : "68px") : "260px",
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <div
      className={cn(
        "h-14 px-4 py-3 flex flex-row md:hidden items-center justify-between bg-slate-950 text-white w-full border-b border-slate-800 shrink-0"
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <span className="font-black text-emerald-400 text-xs">KP</span>
        </div>
        <div className="flex items-center gap-1.5 font-extrabold text-sm text-white">
          KosPasti <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-bold border border-slate-700">ADMIN</span>
        </div>
      </div>
      <div className="flex justify-end z-20">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <Menu className="size-5" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.25,
              ease: "easeInOut",
            }}
            className={cn(
              "fixed h-full w-full inset-0 bg-slate-950 p-6 z-[100] flex flex-col justify-between text-slate-300",
              className
            )}
          >
            <button
              type="button"
              className="absolute right-5 top-4 z-50 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-6" />
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, setOpen, animate } = useSidebar();

  const handleClick = (e: React.MouseEvent) => {
    if (link.onClick) {
      link.onClick(e);
    }
    // Automatically close mobile menu when clicking a link
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setOpen(false);
    }
  };

  const content = (
    <>
      <div className="shrink-0 flex items-center justify-center">
        {link.icon}
      </div>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut",
        }}
        className="text-sm font-medium transition duration-150 whitespace-nowrap overflow-hidden text-ellipsis !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </>
  );

  if (link.href === "#" || !link.href || link.onClick) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex items-center justify-start gap-3 group/sidebar py-2.5 px-2 rounded-xl transition duration-150 cursor-pointer w-full text-left",
          className
        )}
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={link.href}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar py-2.5 px-2 rounded-xl transition duration-150 w-full",
        className
      )}
      {...props}
    >
      {content}
    </Link>
  );
};
