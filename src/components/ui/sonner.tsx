
"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gray-900 group-[.toaster]:text-white group-[.toaster]:border-gray-800 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-gray-300",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton: "group-[.toast]:text-white opacity-70 hover:opacity-100",
        },
      }}
      position="top-right"
      richColors
      closeButton={true}
      duration={3000}
      pauseWhenPageIsHidden={true}
      {...props}
    />
  )
}

export { Toaster }
