import {Notify} from 'quasar'

export const notify = {
  success(msg:string) {
    Notify.create({
      type: 'positive',
      message: msg,
    })
  },
  error(msg:string) {
    Notify.create({
      type: 'negative',
      message: msg,
    })
  },
  warning(msg:string) {
    Notify.create({
      type: 'warning',
      message: msg,
    })
  }
};
