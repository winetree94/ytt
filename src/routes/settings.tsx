import { Flex, Input, MultiSelect, Select, Textarea, FileInput, ScrollArea, Card, Text, Button } from "@mantine/core";
import { useSettingsState } from "../stores/settings";
import { useOriginSubtitlesStore } from "../stores/origin";
import { useMemo, useState } from "react";
import { sbvToJson } from "../tools/sbv";
import { Languages, LanguagesByCode, LanguagesByName } from "../tools/language";
import { GPT_MODELS } from "../tools/gpt";

export function SettingPage() {
  const {
    openAIApiKey,
    setOpenAIApiKey,
    prompt,
    setPrompt,
    model,
    setModel,
    langCodes,
    setLangCodes,
  } = useSettingsState();

  const { subtitles, set } = useOriginSubtitlesStore();

  const [history, setHistory] = useState<{
    [key: string]: { role: string; content: string }[];
  }>();

  const subtitleEntries = useMemo(() => {
    if (!subtitles) {
      return [];
    }
    return Object.entries(subtitles);
  }, [subtitles]);

  async function translate(inputText: string) {
    const baseHistory = langCodes.reduce<{
      [key: string]: { role: string; content: string }[];
    }>((acc, langCode) => {
      acc[langCode] = [
        {
          role: 'system',
          content: `You are a professional translator. translate to "${LanguagesByCode[langCode].name}" Keep context in translations.`
        },
        {
          role: "user",
          content: inputText,
        }
      ];
      return acc;
    }, {});

    setHistory(baseHistory);

    await Promise.all(Object.entries(baseHistory).map(async ([langCode, langHistory]) => {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAIApiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: langHistory
        })
      });

      const data = await response.json();
      const newTranslation = data.choices[0].message.content;
      setHistory({
        ...history,
        [langCode]: [...langHistory, { role: "assistant", content: newTranslation }]
      });
    }));
  }

  return (
    <Flex direction='column'>
      <Button variant="filled" onClick={() => {
        translate('Hello, how are you?');
      }}>Run</Button>

      <Input.Wrapper label="OpenAI API Key" size="md" mt='md'>
        <Input
          value={openAIApiKey}
          onChange={(event) => setOpenAIApiKey(event.currentTarget.value)}
          radius="md"
          variant="filled"
          placeholder="xxxxx-xxx-xx"
        />
      </Input.Wrapper>

      <Textarea
        mt='md'
        label="Prompt"
        description="Input prompt for OpenAI"
        placeholder="Prompt"
        size="md"
        value={prompt}
        onChange={(event) => setPrompt(event.currentTarget.value)}
      />

      <Select
        label="Model"
        placeholder="Pick GPT Model"
        data={Object.values(GPT_MODELS)}
        value={model}
        onChange={(value) => setModel(value!)}
      />

      <MultiSelect
        mt='md'
        size='md'
        label="Target Languages"
        placeholder="Pick value"
        searchable
        data={
          Object.values(Languages).map((lang) => lang.name)
        }
        value={langCodes.map((code) => LanguagesByCode[code].name)}
        onChange={(values) => {
          const codes = values.map((value) => {
            return LanguagesByName[value].code;
          });
          setLangCodes(codes);
        }}
      />

      <FileInput
        mt='md'
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
  )
}