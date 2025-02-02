import { Table, Flex, Input, MultiSelect, Select, Textarea, FileInput, Button, Chip, ScrollArea } from "@mantine/core";
import { useSettingsState } from "../stores/settings";
import { useOriginSubtitlesStore } from "../stores/origin";
import { useMemo, useState } from "react";
import { jsonToSbv, sbvToJson } from "../tools/sbv";
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
    contextLength,
    setContextLength,
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
              `Please use simple and concise words if possible.`,
              prompt,
            ].join('\n'),
          },
        ];
        return acc;
      }, {});

      async function translateOnce(
        langCode: string,
      ) {
        const prompt = history[langCode][0];
        const messageHistory = history[langCode].slice(1);
        const MAX_CONTEXT_LENGTH = 15;
        const partialHistory = messageHistory.slice(-MAX_CONTEXT_LENGTH);

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAIApiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              prompt,
              ...partialHistory,
            ]
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

      await subtitleEntries.reduce<Promise<void>>((result, [timeline, text], index) => {
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

      <Input.Wrapper label="Context Length" size="md" mt='md'>
        <Input
          value={contextLength}
          onChange={(event) => setContextLength(Number(event.currentTarget.value))}
          radius="md"
          variant="filled"
          placeholder="10"
          type="number"
        />
      </Input.Wrapper>

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

      <ScrollArea>
        <Table mt='md' layout="fixed" >
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 200 }}>Time</Table.Th>
              <Table.Th style={{ width: 200 }}>Base Translation</Table.Th>
              {
                langCodes.map((langCode) => (
                  <Table.Th key={langCode} style={{ width: 200 }}>
                    {LanguagesByCode[langCode].name}
                    <Button
                      disabled={!translations[langCode] || progress !== -1}
                      ml='lg'
                      size="xs"
                      onClick={() => {
                        const sbv = jsonToSbv(translations[langCode]);
                        const blob = new Blob([sbv], { type: 'application/text' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${LanguagesByCode[langCode].name}.sbv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}>
                      Download
                    </Button>
                  </Table.Th>
                ))
              }
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {subtitleEntries.map(([timeline, text], index) => (
              <Table.Tr key={index}>
                <Table.Td>
                  <Chip>
                    {timeline}
                  </Chip>
                </Table.Td>
                <Table.Td>{text}</Table.Td>
                {
                  langCodes.map((langCode) => (
                    <Table.Td key={langCode}>
                      {translations[langCode]?.[timeline]}
                    </Table.Td>
                  ))
                }
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Flex>
  )
}