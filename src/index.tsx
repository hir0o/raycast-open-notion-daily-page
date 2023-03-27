import { ActionPanel, Action, Detail } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";
import { format } from "date-fns";
import fetch from "node-fetch";
import { secret } from "./secret";

let isSetUrl = false;

export default function Command() {
  const [url, setUrl] = useState("");
  const [created, setCreated] = useState(false);
  const { data, isLoading, error } = useFetch<{
    results: {
      url: string;
    }[];
  }>(`https://api.notion.com/v1/databases/${secret.notion_db_id}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret.notion_token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: {
        property: "date",
        date: {
          equals: format(new Date(), "yyyy-MM-dd"),
        },
      },
    }),
  });

  if (!isSetUrl && data !== undefined) {
    isSetUrl = true;
    console.dir(data, { depth: null });

    if (data.results.length > 0) {
      setUrl(data.results[0].url);
      setCreated(true);
    }
  }

  const createPage = async () => {
    fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret.notion_token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: {
          database_id: secret.notion_db_id,
        },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: format(new Date(), "yyyy/MM/dd"),
                },
              },
            ],
          },
          date: {
            date: {
              start: format(new Date(), "yyyy-MM-dd"),
            },
          },
        },
      }),
    })
      .then((res) => res.json())
      .then((json: any) => {
        setUrl(json.url);
        setCreated(true);
      });
  };

  return (
    <Detail
      markdown={isLoading ? "読み込み中..." : created ? "作成済みです" : "新規作成します。"}
      actions={
        <ActionPanel>
          {created ? <Action.OpenInBrowser url={url} /> : <Action title="作成" onAction={createPage} />}
        </ActionPanel>
      }
    />
  );
}
