import { FileInput, Flex, ScrollArea } from "@mantine/core";
import { sbvToJson } from "../tools/sbv";
import { useOriginSubtitlesStore } from "../stores/origin";
import { useMemo } from "react";
import { Card, Text } from '@mantine/core';

export function IndexPage() {
  const { subtitles, set } = useOriginSubtitlesStore();

  const subtitleEntries = useMemo(() => {
    if (!subtitles) {
      return [];
    }
    return Object.entries(subtitles);
  }, [subtitles]);

  return (
    <Flex direction='column'>
      <FileInput
        size="md"
        label="File"
        description="Upload sbv file"
        placeholder="Press to upload"
        onChange={async (file) => {
          if (!file) {
            return;
          }
          const reader = new FileReader();

          reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result !== 'string') {
              return;
            }
            const final = sbvToJson(result);
            set(final);
          }

          reader.readAsText(file);
        }}
      />
      <ScrollArea h={400} p='md'>
        <Flex direction='column' gap='md'>
          {subtitleEntries.map(([timeline, text], index) => (
            <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
              <Text fw={500} mb='xs'>{timeline}</Text>
              <Text size="sm" c="dimmed">
                {text}
              </Text>
            </Card>
          ))}
        </Flex>
      </ScrollArea>
    </Flex>
  );
}