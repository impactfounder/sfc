import { fetchFeedPosts } from "@/lib/actions/feed"
import { FeedSection } from "@/components/home/feed-section"

export async function FeedSectionContainer() {
    const posts = await fetchFeedPosts(1, "latest")
    return <FeedSection initialPosts={posts as any} />
}
