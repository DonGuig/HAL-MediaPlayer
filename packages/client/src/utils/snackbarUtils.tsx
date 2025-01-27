import { OptionsObject, useSnackbar, WithSnackbarProps } from "notistack"
import React from "react"

// here to use notistack outside of a react component or functional component

// Must be imported at least once in the app to initialize the ref
let snackbarRef: WithSnackbarProps
export const SnackbarUtilsConfigurator: React.FC = () => {
  snackbarRef = useSnackbar()
  return null
}

const globalSnackbar =  {
  success(msg: string, options: OptionsObject = {}): void {
    this.toast(msg, { ...options, variant: "success" })
  },
  warning(msg: string, options: OptionsObject = {}): void {
    this.toast(msg, { ...options, variant: "warning" })
  },
  info(msg: string, options: OptionsObject = {}): void {
    this.toast(msg, { ...options, variant: "info" })
  },
  error(msg: string, options: OptionsObject = {}): void {
    this.toast(msg, { ...options, variant: "error" })
  },
  toast(msg: string, options: OptionsObject = {}): void {
    snackbarRef.enqueueSnackbar(msg, options)
  },
  dismissAll() : void {
    snackbarRef.closeSnackbar();
  }
}

export default globalSnackbar;