import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Bell, CheckCheck, PenSquare } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "../context/NotificationContext";

function timeAgo(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, addNotification } =
    useNotifications();

  const isDeveloperMode =
    typeof localStorage !== "undefined" &&
    localStorage.getItem("lekhya_superuser_active") === "1";

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [toAll, setToAll] = useState(true);

  function handleCompose() {
    if (!title.trim() || !message.trim()) return;
    addNotification({ fromRole: "superuser", title, message, toAll });
    setTitle("");
    setMessage("");
    setToAll(true);
    setComposeOpen(false);
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-ocid="notification.bell"
          className="relative p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-ocid="notification.panel"
        align="end"
        className="w-80 p-0 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-semibold text-sm text-foreground">Notifications</p>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                data-ocid="notification.mark-all-read.button"
                onClick={markAllRead}
                className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <button
                  type="button"
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-muted/50 ${!n.isRead ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                    <div className={`flex-1 min-w-0 ${n.isRead ? "pl-4" : ""}`}>
                      <p className="text-sm font-medium text-foreground truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {timeAgo(n.createdAt)} ·{" "}
                        <span className="capitalize">{n.fromRole}</span>
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer — compose (SuperUser only) */}
        {isDeveloperMode && (
          <div className="px-4 py-3 border-t border-border">
            <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="notification.compose.open_modal_button"
                  className="w-full gap-2 text-xs"
                >
                  <PenSquare className="w-3.5 h-3.5" />
                  Compose Notification
                </Button>
              </DialogTrigger>
              <DialogContent
                data-ocid="notification.compose.dialog"
                className="max-w-md"
              >
                <DialogHeader>
                  <DialogTitle>Compose Notification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="notif-title">Title</Label>
                    <Input
                      id="notif-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Notification title…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notif-message">Message</Label>
                    <Textarea
                      id="notif-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your message…"
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="notif-toAll"
                      checked={toAll}
                      onCheckedChange={(v) => setToAll(!!v)}
                    />
                    <Label
                      htmlFor="notif-toAll"
                      className="text-sm cursor-pointer"
                    >
                      Send to all users
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setComposeOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    data-ocid="notification.compose.submit_button"
                    onClick={handleCompose}
                    disabled={!title.trim() || !message.trim()}
                  >
                    Send Notification
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
