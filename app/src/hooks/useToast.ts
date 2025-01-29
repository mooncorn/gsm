import { toast, Bounce, ToastOptions } from "react-toastify";

const defaultOptions: ToastOptions = {
  position: "bottom-right",
  autoClose: 3000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "colored",
  transition: Bounce,
};

export function useToast() {
  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      ...defaultOptions,
      ...options,
    });
  };

  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      ...defaultOptions,
      ...options,
    });
  };

  const info = (message: string, options?: ToastOptions) => {
    toast.info(message, {
      ...defaultOptions,
      ...options,
    });
  };

  const warning = (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      ...defaultOptions,
      ...options,
    });
  };

  return {
    success,
    error,
    info,
    warning,
  };
}
