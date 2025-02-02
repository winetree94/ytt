import { Tabs, Flex, Input, MultiSelect, Select, Textarea, FileInput, ScrollArea, Card, Text, Button } from "@mantine/core";
import { useSettingsState } from "../stores/settings";
import { useOriginSubtitlesStore } from "../stores/origin";
import { useMemo, useState } from "react";
import { sbvToJson } from "../tools/sbv";
import { Languages, LanguagesByCode, LanguagesByName } from "../tools/language";
import { GPT_MODELS } from "../tools/gpt";
import { useTranslatedSubtitlesStore } from "../stores/translation";

export function SettingPage() {
  const [progress, setProgress] = useState(-1);

  const {
    openAIApiKey,
    setOpenAIApiKey,
    prompt,
    setPrompt,
    model,
    setModel,
    baseLangCode,
    setBaseLangCode,
    langCodes,
    setLangCodes,
  } = useSettingsState();

  const { subtitles, set } = useOriginSubtitlesStore();

  const {
    translations,
    appendTranslation,
    setTranslation,
  } = useTranslatedSubtitlesStore();

  const subtitleEntries = useMemo(() => {
    if (!subtitles) {
      return [];
    }
    return Object.entries(subtitles);
  }, [subtitles]);

  const translationsEntries = useMemo(() => {
    if (!translations) {
      return [];
    }
    return Object.entries(translations);
  }, [translations]);

  async function translate() {
    if (!openAIApiKey) {
      return;
    }

    if (!langCodes.length) {
      return;
    }

    try {
      setProgress(0);

      setTranslation(langCodes.reduce<{
        [key: string]: { [key: string]: string };
      }>((acc, langCode) => {
        acc[langCode] = {};
        return acc;
      }, {})
      );

      const history = langCodes.reduce<{
        [key: string]: { role: string; content: string }[];
      }>((acc, langCode) => {
        acc[langCode] = [
          {
            role: 'system',
            content: [
              `You are a professional translator.`,
              `translate ${LanguagesByCode[baseLangCode].name} into ${LanguagesByCode[langCode].name}`,
              `Keep context in translations.`,
              prompt,
            ].join('\n'),
          },
        ];
        return acc;
      }, {});

      async function translateOnce(
        langCode: string,
      ) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAIApiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: history[langCode]
          })
        });

        if (!response.ok && response.status === 429) {
          await new Promise((resolve) => {
            setTimeout(resolve, 2000);
          });
          return translateOnce(langCode);
        }

        const data = await response.json() as {
          "id": string,
          "object": string,
          "created": number,
          "model": string,
          "choices": {
            "index": number,
            "message": {
              "role": string,
              "content": string,
            },
          }[],
        };

        return data.choices[0].message;
      }

      await subtitleEntries.reduce<Promise<any>>((result, [timeline, text], index) => {
        return result.then(async () => {
          await Promise.all(langCodes.map(async (langCode) => {
            history[langCode].push({
              role: 'user',
              content: text,
            });
            const translated = await translateOnce(langCode);
            history[langCode].push(translated);
            appendTranslation(langCode, timeline, translated.content);
          }));

          setProgress(Math.ceil(index / subtitleEntries.length * 100));
        });
      }, Promise.resolve());
    } finally {
      setProgress(-1);
    }
  }

  return (
    <Flex direction='column'>
      <Button
        variant="filled"
        onClick={() => {
          translate();
        }}
        disabled={progress !== -1}
      >
        {progress === -1 ? 'Run' : `${progress}%`}
      </Button>

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
        mt='md'
        size='md'
      />

      <Select
        label="Base Language"
        placeholder="Pick Base Language"
        data={Object.values(Languages).map((lang) => lang.name)}
        value={LanguagesByCode[baseLangCode]?.name}
        onChange={(value) => setBaseLangCode(LanguagesByName[value!].code)}
        mt='md'
        size='md'
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

      <Tabs defaultValue="gallery">
        <Tabs.List>
          {translationsEntries.map(([langCode]) => (
            <Tabs.Tab key={langCode} value={langCode}>
              {LanguagesByCode[langCode].name}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {
          translationsEntries.map(([langCode, translations]) => (
            <Tabs.Panel key={langCode} value={langCode}>
              <ScrollArea h={400} p='md'>
                <Flex direction='column' gap='md'>
                  {Object.entries(translations).map(([timeline, text]) => (
                    <Card key={timeline} shadow="sm" padding="lg" radius="md" withBorder>
                      <Card key={timeline} shadow="sm" padding="lg" radius="md" withBorder>
                        <Text fw={500} mb='xs'>{timeline}</Text>
                        <Text size="sm" c="dimmed">
                          {text}
                        </Text>
                      </Card>
                    </Card>
                  ))}
                </Flex>
              </ScrollArea>
            </Tabs.Panel>
          ))
        }
      </Tabs>
    </Flex>
  )
}