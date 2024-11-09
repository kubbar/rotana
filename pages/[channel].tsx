import { GetServerSideProps } from 'next'
import Head from 'next/head'

interface ChannelPageProps {
  streamingLink: string | null
}

export const getServerSideProps: GetServerSideProps<ChannelPageProps> = async (context) => {
  const { channel } = context.params || {}

  if (!channel || typeof channel !== 'string') {
    return { notFound: true }
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || `https://${context.req.headers.host}`
    const res = await fetch(`${apiUrl}/api/getChannelData?channel=${channel}`)
    const data = await res.json()

    return { props: { streamingLink: data.streamingLink || null } }
  } catch (error) {
    console.error('Error fetching streaming link:', error)
    return { props: { streamingLink: null } }
  }
}

export default function ChannelPage({ streamingLink }: ChannelPageProps) {
  if (!streamingLink) return <p>No streaming link found</p>

  return (
    <>
      <Head>
        <title>Streaming Link</title>
      </Head>
      <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', margin: 0, padding: '10px' }}>
        {streamingLink}
      </pre>
    </>
  )
}
