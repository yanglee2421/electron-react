import {
  AddOutlined,
  ArrowUpwardOutlined,
  AutorenewOutlined,
  ContentCopyOutlined,
  DeleteOutlined,
  MoreVertOutlined,
  StopOutlined,
  ThumbDown,
  ThumbDownOutlined,
  ThumbUp,
  ThumbUpOutlined,
} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  CircularProgress,
  Divider,
  Fab,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { z } from "zod";
import React from "react";
import openai from "openai";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useLiveQuery } from "dexie-react-hooks";
import { useNotifications } from "@toolpad/core";
import { persist, createJSONStorage } from "zustand/middleware";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { db } from "#renderer/lib/db";
import { Markdown } from "#renderer/components/markdown";
import type { MessageInAPI, Message } from "#renderer/lib/db";

const schema = z.object({
  question: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
  },
  formComponents: {
    IconButton,
  },
});

const makeInitalChatStore = () => {
  return {
    completionId: 0,
  };
};

const useChatStore = create<ReturnType<typeof makeInitalChatStore>>()(
  persist(immer(makeInitalChatStore), {
    storage: createJSONStorage(() => localStorage),
    name: "useChatStore",
  }),
);

const client = new openai.OpenAI({
  apiKey: "rCJALwydCHKaiiBolPGv:gxneLXlgwLjQQcsNnnEW",
  baseURL: "https://spark-api-open.xf-yun.com/v1",
  dangerouslyAllowBrowser: true,
});

type SendButtonStatus = "idle" | "loading" | "streaming";

type SendButtonProps = {
  status: SendButtonStatus;
  onAbortChat?: (e: React.SyntheticEvent) => void;
  form: string;
};

const SendButton = (props: SendButtonProps) => {
  switch (props.status) {
    case "loading":
      return (
        <Fab type="button" size="small" form={props.form} disabled>
          <CircularProgress size={20} color="inherit" />
        </Fab>
      );
    case "streaming":
      return (
        <Fab
          /*
           * Solution 1:
           * When onClick event changes the button's type from button to submit, the form would be submitted.
           * But when using a key prop, the onClick event replaces the entire DOM node instead of just
           * updating the type, so the form won't be submitted.
           */
          key={"stop"}
          type="button"
          onClick={props.onAbortChat}
          size="small"
          color="error"
          form={props.form}
        >
          <StopOutlined fontSize="small" />
        </Fab>
      );
    case "idle":
    default:
      return (
        <Fab type="submit" size="small" form={props.form} color="primary">
          <ArrowUpwardOutlined fontSize="small" />
        </Fab>
      );
  }
};

type MarkdownContentProps = {
  text: string;
};

const MarkdownContent = (props: MarkdownContentProps) => {
  return (
    <Box
      component={"article"}
      sx={{
        "& pre.shiki": {
          whiteSpace: "pre-wrap",
        },
      }}
    >
      <Markdown code={props.text} />
    </Box>
  );
};

type ChatLogItemProps = {
  question: React.ReactNode;
  answer: React.ReactNode;
  enableScroll?: boolean;
};

const ChatLogItem = ({
  question,
  answer,

  enableScroll,
}: ChatLogItemProps) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!enableScroll) return;

    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [enableScroll]);

  return (
    <>
      <Box
        ref={scrollRef}
        sx={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        {question}
      </Box>
      <Box
        sx={{
          "&:last-child": {
            minBlockSize: "100dvh",
          },
        }}
      >
        {answer}
      </Box>
    </>
  );
};

type ThumbButtonProps = {
  message: Message;
};

const ThumbButton = (props: ThumbButtonProps) => {
  const i = props.message;

  switch (i.thumb) {
    case "up":
      return (
        <IconButton size="small" disabled>
          <ThumbUp />
        </IconButton>
      );
    case "down":
      return (
        <IconButton size="small" disabled>
          <ThumbDown />
        </IconButton>
      );
    default:
      return (
        <>
          <IconButton
            size="small"
            onClick={async () => {
              await db.messages.update(i.id, {
                thumb: "up",
              });
            }}
          >
            <ThumbUpOutlined />
          </IconButton>
          <IconButton
            size="small"
            onClick={async () => {
              await db.messages.update(i.id, {
                thumb: "down",
              });
            }}
          >
            <ThumbDownOutlined />
          </IconButton>
        </>
      );
  }
};

type AnswerProps = {
  message: Message;
  sendButtonStatus: SendButtonStatus;
  onRetry: (message: Message) => void;
};

const Answer = (props: AnswerProps) => {
  const { sendButtonStatus, onRetry: runRetry, message: i } = props;

  const snackbar = useNotifications();

  switch (i.status) {
    case "loading":
      return (
        <div>
          <Skeleton />
          <Skeleton animation="wave" />
          <Skeleton animation={false} />
        </div>
      );
    case "error":
      return (
        <>
          <Alert severity="error" variant="filled">
            <AlertTitle>Error</AlertTitle>
            {i.answer}
          </Alert>
          <p>
            <IconButton
              size="small"
              onClick={() => runRetry(i)}
              disabled={sendButtonStatus !== "idle"}
            >
              <AutorenewOutlined />
            </IconButton>
          </p>
        </>
      );
    case "success":
      return (
        <>
          <MarkdownContent text={i.answer} />
          <p>
            <IconButton
              onClick={async () => {
                await navigator.clipboard.writeText(i.answer);
                snackbar.show("Copied Successfully", {
                  severity: "success",
                });
              }}
              size="small"
            >
              <ContentCopyOutlined />
            </IconButton>
            <ThumbButton message={props.message} />
            <IconButton
              size="small"
              onClick={() => runRetry(i)}
              disabled={sendButtonStatus !== "idle"}
            >
              <AutorenewOutlined />
            </IconButton>
            <Typography variant="caption" color="text.secondary">
              {new Date(i.answerDate!).toLocaleTimeString()}
            </Typography>
          </p>
        </>
      );
    case "pending":
      return <MarkdownContent text={i.answer} />;
    default:
      return null;
  }
};

const useScrollToBottom = () => {
  const chatLogRef = React.useRef<HTMLDivElement>(null);

  const handleScrollToBottom = React.useEffectEvent(() => {
    chatLogRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  });

  React.useEffect(() => handleScrollToBottom(), []);

  return chatLogRef;
};

const useScrollToView = () => {
  return React.useState(0);
};

export const Component = () => {
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(
    null,
  );
  const [sendButtonStatus, setSendButtonStatus] =
    React.useState<SendButtonStatus>("idle");

  const formId = React.useId();
  const controllerRef = React.useRef<AbortController | null>(null);

  const completionId = useChatStore((store) => store.completionId);
  const setChatStore = useChatStore.setState;
  const chatLogRef = useScrollToBottom();
  const [scrollId, setScrollId] = useScrollToView();

  const completions = useLiveQuery(() => {
    return db.completions.toArray();
  }, []);

  const completion = useLiveQuery(() => {
    return db.completions.get(completionId);
  }, [completionId]);

  const chatLogs = useLiveQuery(() => {
    if (!completion) return [];
    return db.messages.where("completionId").equals(completion.id).toArray();
  }, [completion]);

  const form = useAppForm({
    defaultValues: {
      question: "",
    },
    validators: {
      onChange: schema,
    },
    async onSubmit({ value }) {
      await handleSubmit(value);
    },
  });

  const runFetch = async (id: number, messages: MessageInAPI[]) => {
    const stream = await client.chat.completions.create({
      messages,
      stream: true,
      model: "4.0Ultra",
      web_search_options: { search_context_size: "high" },
    });

    controllerRef.current = stream.controller;
    setSendButtonStatus("streaming");
    let answer = "";

    for await (const chunk of stream) {
      for (const choice of chunk.choices) {
        if (!choice.delta.content) return;
        answer += choice.delta.content;
        await db.messages.update(id, {
          answer,
          status: "pending",
        });
      }
    }

    await db.messages.update(id, {
      answer,
      status: "success",
      answerDate: new Date().toISOString(),
    });
  };

  const runChat = async (id: number, messages: MessageInAPI[]) => {
    setSendButtonStatus("loading");

    await runFetch(id, messages).catch(async (e) => {
      await db.messages.update(id, {
        answer: e.message,
        status: "error",
      });
    });

    setSendButtonStatus("idle");
  };

  const handleRetry = async (log: Message) => {
    setScrollId(log.id);
    await db.messages.update(log.id, { status: "loading", thumb: null });
    await runChat(log.id, log.messages);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleSubmit = async (data: FormValues) => {
    if (sendButtonStatus !== "idle") return;

    form.reset();
    let completionId = 0;
    const question = data.question.trim();

    // No completion
    if (!completion) {
      completionId = await db.completions.add({
        name: question,
      });
      setChatStore((draft) => {
        draft.completionId = completionId;
      });

      // Has completion but no messages
    } else if (!chatLogs?.length) {
      completionId = completion.id;
      await db.completions.update(completion.id, {
        name: question,
      });

      // Has completion and messages
    } else {
      completionId = completion.id;
    }

    const prevMessages =
      chatLogs?.flatMap((i) => [
        { role: "user" as const, content: i.question },
        { role: "assistant" as const, content: i.answer },
      ]) || [];

    const messages = prevMessages.concat({ role: "user", content: question });

    const id = await db.messages.add({
      question,
      questionDate: new Date().toISOString(),
      messages,
      answer: "",
      answerDate: null,
      status: "loading",
      thumb: null,
      completionId,
    });

    setScrollId(id);
    await runChat(id, messages);
  };

  const handleChatAbort = (e: React.SyntheticEvent) => {
    /*
     * Solution 2:
     * A button with type=submit can prevent form submission by preventing the default event behavior,
     * which is more performant compared to Solution 1 because there's no DOM replacement
     */
    e.preventDefault();
    controllerRef.current?.abort();
  };

  return (
    <>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          backgroundColor: (theme) => theme.palette.background.default,
        }}
      >
        <Box
          sx={{
            display: "flex",
            paddingInline: 1.5,
            paddingBlock: 1.5,
            alignItems: "center",
          }}
        >
          <Box sx={{ flex: 1, minInlineSize: 0 }}>
            <Typography variant="h6">Copilot Chat</Typography>
            <Typography variant="subtitle1">#{completion?.id}</Typography>
          </Box>
          <IconButton
            onClick={(e) => setMenuAnchorEl(e.currentTarget)}
            size="large"
          >
            <MoreVertOutlined />
          </IconButton>
          <Menu
            open={!!menuAnchorEl}
            onClose={handleMenuClose}
            anchorEl={menuAnchorEl}
          >
            <MenuItem
              onClick={async () => {
                handleMenuClose();
                const id = await db.completions.add({ name: "New completion" });
                setChatStore((draft) => {
                  draft.completionId = id;
                });
              }}
            >
              <ListItemIcon>
                <AddOutlined />
              </ListItemIcon>
              <ListItemText primary="Add completion" />
            </MenuItem>
            {completions?.map((i) => (
              <MenuItem
                key={i.id}
                onClick={() => {
                  handleMenuClose();
                  setChatStore((draft) => {
                    draft.completionId = i.id;
                  });
                }}
              >
                {i.name}
              </MenuItem>
            ))}
            {completion && (
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  db.completions.delete(completion.id);
                  db.messages
                    .where("completionId")
                    .equals(completion.id)
                    .delete();
                }}
              >
                <ListItemIcon>
                  <DeleteOutlined color="error" />
                </ListItemIcon>
                <ListItemText primary="Delete completion" />
              </MenuItem>
            )}
          </Menu>
        </Box>
        <Divider />
      </Box>
      {chatLogs?.map((i) => (
        <ChatLogItem
          key={i.id}
          question={
            <div>
              <Paper
                sx={{
                  padding: 1.5,
                  bgcolor: (t) => t.palette.primary.main,
                  color: (t) => t.palette.primary.contrastText,
                }}
              >
                {i.question}
              </Paper>
              <Typography variant="caption" color="text.secondary">
                {new Date(i.questionDate).toLocaleTimeString()}
              </Typography>
            </div>
          }
          answer={
            <Answer
              message={i}
              onRetry={handleRetry}
              sendButtonStatus={sendButtonStatus}
            />
          }
          enableScroll={Object.is(i.id, scrollId)}
        />
      ))}
      <div ref={chatLogRef} />
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          backgroundColor: (theme) => theme.palette.background.default,

          paddingBottom: 1.5,
        }}
      >
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          onReset={() => {
            form.reset();
          }}
          noValidate
        >
          <form.AppField name="question">
            {(questionField) => (
              <questionField.TextField
                value={questionField.state.value}
                onChange={(e) => {
                  questionField.handleChange(e.target.value);
                }}
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <SendButton
                          status={sendButtonStatus}
                          onAbortChat={handleChatAbort}
                          form={formId}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          </form.AppField>
        </form>
      </Box>
    </>
  );
};
