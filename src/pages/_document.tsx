import {
  Html,
  Head,
  Main,
  NextScript
} from "next/document"

const Document = () => (
  <Html suppressHydrationWarning>
    <Head />
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
)

export default Document