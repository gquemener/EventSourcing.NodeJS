import {EventStoreDBClient, EventType, ResolvedEvent, StreamingRead} from "@eventstore/db-client";

let eventStore: EventStoreDBClient;

export const getEventStore = (connectionString: string) => {
    if (!eventStore) {
        eventStore = EventStoreDBClient.connectionString(
            connectionString
        );
    }

    return {
        readStream: <E extends EventType>(category: string, aggregateId: string): StreamingRead<ResolvedEvent<E>> => {
            const streamName = `${category}-${aggregateId}`;

            return eventStore.readStream(streamName);
        }
    };
};

