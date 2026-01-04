import { createApp } from './app.js'

const app = createApp()
const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Tea API running at http://localhost:${port}`)
  console.log(`TIF signature: http://localhost:${port}/brew`)
})
