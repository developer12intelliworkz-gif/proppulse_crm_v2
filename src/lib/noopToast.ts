/** No-op toast — notifications disabled app-wide. */
const noop = () => undefined;

const noopReturn = {
  id: "",
  dismiss: noop,
  update: noop,
};

export const noopToast = Object.assign(
  () => noopReturn,
  {
    success: noop,
    error: noop,
    warning: noop,
    info: noop,
    message: noop,
    dismiss: noop,
    loading: () => ({ dismiss: noop }),
    promise: <T,>(p: Promise<T>) => p,
  },
);
