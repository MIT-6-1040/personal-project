import { onBeforeUnmount, watch, type Ref } from "vue";

// The backend sends lists ten at a time. A shorter page means the list has ended.
export const pageSize = 10;

// Calls loadMore whenever the marker element at the bottom of a list scrolls into view.
export function useInfiniteScroll(marker: Readonly<Ref<HTMLElement | null>>, loadMore: () => Promise<void>) {
  let busy = false;

  const observer = new IntersectionObserver(
    async (entries) => {
      if (busy || !entries.some((entry) => entry.isIntersecting)) return;
      busy = true;
      await loadMore();
      busy = false;
      // If the marker is still on screen (a short page, or a search hiding most cards),
      // observing again makes the observer report it once more and load the next page.
      const element = marker.value;
      if (element) {
        observer.unobserve(element);
        observer.observe(element);
      }
    },
    { rootMargin: "300px" },
  );

  watch(
    marker,
    (element, previous) => {
      if (previous) observer.unobserve(previous);
      if (element) observer.observe(element);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => observer.disconnect());
}
