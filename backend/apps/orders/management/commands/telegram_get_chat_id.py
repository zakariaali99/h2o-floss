"""Print the chat id(s) that have messaged the store's Telegram bot.

Usage:
    1. Create the bot with @BotFather and save its token in Store Settings
       (or pass --token).
    2. On the manager's phone, open the bot and tap Start (send any message).
    3. Run: python manage.py telegram_get_chat_id
    4. Copy the printed chat id into Store Settings → telegram_chat_ids.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request

from django.core.management.base import BaseCommand, CommandError

from apps.core.models import StoreSettings


class Command(BaseCommand):
    help = "Show Telegram chat ids that have messaged the bot (for configuring manager alerts)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--token",
            default="",
            help="Bot token (defaults to StoreSettings.telegram_bot_token).",
        )

    def handle(self, *args, **options):
        token = (options.get("token") or StoreSettings.get_settings().telegram_bot_token or "").strip()
        if not token:
            raise CommandError(
                "No bot token. Save it in Store Settings or pass --token=<token>."
            )

        url = f"https://api.telegram.org/bot{token}/getUpdates"
        try:
            with urllib.request.urlopen(url, timeout=15) as response:
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            raise CommandError(f"Telegram API error HTTP {exc.code}: {exc.read().decode('utf-8', 'replace')[:300]}")
        except Exception as exc:
            raise CommandError(f"Could not reach Telegram: {exc}")

        if not data.get("ok"):
            raise CommandError(f"Telegram returned: {data}")

        results = data.get("result", [])
        if not results:
            self.stdout.write(self.style.WARNING(
                "No messages yet. On the manager's phone, open the bot and tap Start, then re-run."
            ))
            return

        seen = {}
        for update in results:
            msg = update.get("message") or update.get("edited_message") or {}
            chat = msg.get("chat") or {}
            chat_id = chat.get("id")
            if chat_id is None:
                continue
            name = chat.get("title") or " ".join(
                p for p in [chat.get("first_name"), chat.get("last_name")] if p
            ) or chat.get("username") or "—"
            seen[chat_id] = name

        if not seen:
            self.stdout.write(self.style.WARNING("No chat ids found in recent updates."))
            return

        self.stdout.write(self.style.SUCCESS("Chat ids that messaged the bot:"))
        for chat_id, name in seen.items():
            self.stdout.write(f"  {chat_id}   ({name})")
        self.stdout.write("\nCopy the id(s) into Store Settings → telegram_chat_ids (comma-separated).")
