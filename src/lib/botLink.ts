import { BOT_URL_PATTERN } from "./view";
/** Same rule as the existing decision page (src/components/trading/DecisionCard.tsx): the bot link is used only when NEXT_PUBLIC_TWINS_APPROVAL_BOT_URL is exactly https://t.me/<bot>. It opens the bot, never a specific decision. */
export { BOT_URL_PATTERN };
const BOT = process.env.NEXT_PUBLIC_TWINS_APPROVAL_BOT_URL ?? "";
export const BOT_LINK: string | null = BOT_URL_PATTERN.test(BOT) ? BOT : null;
