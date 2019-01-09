import css from './index.css'
import controller from './app'

const app = controller()

const emojis = [
  { icon: '😀', response: 'emoji-happy' },
  { icon: '😞', response: 'emoji-sad' },
  { icon: '😕', response: 'emoji-confused' },
  { icon: '👍', response: 'emoji-thumbsup' },
  { icon: '👎', response: 'emoji-thumbsdown' }
]

app.init({
  entryID: 'entry',
  emojis,
  endpoints: {
    emojiEndpoint: '',
    formEndpoint: '',
    votesEndpoint: ''
  }
})
