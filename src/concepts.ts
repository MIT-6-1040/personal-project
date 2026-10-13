import { conceptSet, registerConcept } from "@mit-sdg/sync-engine/assembly";
import authenticatingSpec from "@design/concepts/Authenticating.md" with { type: "text" };
import feedCuratingSpec from "@design/concepts/FeedCurating.md" with { type: "text" };
import interestTrackingSpec from "@design/concepts/InterestTracking.md" with { type: "text" };
import readingHistorySpec from "@design/concepts/ReadingHistory.md" with { type: "text" };
import sessioningSpec from "@design/concepts/Sessioning.md" with { type: "text" };
import storyGroupingSpec from "@design/concepts/StoryGrouping.md" with { type: "text" };
import {
  AuthenticatingConcept,
  InvalidCredentials,
  InvalidUsername,
  UsernameTaken,
  WeakPassword,
} from "./concepts/Authenticating.ts";
import { FeedCuratingConcept } from "./concepts/FeedCurating.ts";
import {
  InterestTrackingConcept,
  InvalidCount,
  InvalidTopic,
  TopicAlreadyAdded,
  TopicNotFound,
} from "./concepts/InterestTracking.ts";
import { AlreadyRead, ReadingHistoryConcept } from "./concepts/ReadingHistory.ts";
import { SessioningConcept, UnknownSession } from "./concepts/Sessioning.ts";
import { DuplicateArticle, StoryGroupingConcept } from "./concepts/StoryGrouping.ts";

// Each concept is registered with its spec and the error class for each refusal code.
const authenticating = registerConcept({
  class: AuthenticatingConcept,
  spec: authenticatingSpec,
  refusals: {
    INVALID_USERNAME: InvalidUsername,
    WEAK_PASSWORD: WeakPassword,
    USERNAME_TAKEN: UsernameTaken,
    INVALID_CREDENTIALS: InvalidCredentials,
  },
});

const sessioning = registerConcept({
  class: SessioningConcept,
  spec: sessioningSpec,
  refusals: { UNKNOWN_SESSION: UnknownSession },
});

const storyGrouping = registerConcept({
  class: StoryGroupingConcept,
  spec: storyGroupingSpec,
  refusals: { DUPLICATE_ARTICLE: DuplicateArticle },
});

const interestTracking = registerConcept({
  class: InterestTrackingConcept,
  spec: interestTrackingSpec,
  refusals: {
    INVALID_TOPIC: InvalidTopic,
    INVALID_COUNT: InvalidCount,
    TOPIC_ALREADY_ADDED: TopicAlreadyAdded,
    TOPIC_NOT_FOUND: TopicNotFound,
  },
});

const readingHistory = registerConcept({
  class: ReadingHistoryConcept,
  spec: readingHistorySpec,
  refusals: { ALREADY_READ: AlreadyRead },
});

const feedCurating = registerConcept({
  class: FeedCuratingConcept,
  spec: feedCuratingSpec,
});

export const applicationConceptSet = conceptSet({
  Authenticating: authenticating,
  Sessioning: sessioning,
  StoryGrouping: storyGrouping,
  InterestTracking: interestTracking,
  ReadingHistory: readingHistory,
  FeedCurating: feedCurating,
});
export const { concepts } = applicationConceptSet;
