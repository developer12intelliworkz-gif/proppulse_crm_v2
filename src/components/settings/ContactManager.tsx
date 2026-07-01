import { useState } from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CompanyContact } from "./companyRegistrationTypes";
import { emptyContact } from "./companyRegistrationTypes";
import { sanitizePhoneInput } from "@/utils/phoneValidation";

const SALUTATIONS = ["Mr.", "Mrs.", "Ms.", "Dr."];
const CONTACT_TYPES = ["Director", "Manager", "Executive", "Other"];

interface ContactManagerProps {
  contacts: CompanyContact[];
  onChange: (contacts: CompanyContact[]) => void;
  errors: Record<string, string>;
}

export default function ContactManager({
  contacts,
  onChange,
  errors,
}: ContactManagerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<CompanyContact>(emptyContact());
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const openAdd = () => {
    setEditingIndex(null);
    setDraft(emptyContact());
    setDraftErrors({});
    setSheetOpen(true);
  };

  const openEdit = (index: number) => {
    setEditingIndex(index);
    setDraft({ ...contacts[index] });
    setDraftErrors({});
    setSheetOpen(true);
  };

  const validateDraft = (): boolean => {
    const next: Record<string, string> = {};
    if (!draft.firstName.trim()) next.firstName = "First name is required";
    if (!draft.phone.trim()) next.phone = "Phone is required";
    if (!draft.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      next.email = "Enter a valid email";
    }
    setDraftErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveDraft = () => {
    if (!validateDraft()) return;
    let next = [...contacts];
    const contact = { ...draft };
    if (contact.isPrimary) {
      next = next.map((c) => ({ ...c, isPrimary: false }));
    }
    if (editingIndex !== null) {
      next[editingIndex] = contact;
    } else {
      if (next.length === 0) contact.isPrimary = true;
      next.push(contact);
    }
    onChange(next);
    setSheetOpen(false);
  };

  const confirmDelete = () => {
    if (deleteIndex === null) return;
    const next = contacts.filter((_, i) => i !== deleteIndex);
    if (contacts[deleteIndex]?.isPrimary && next.length > 0) {
      next[0] = { ...next[0], isPrimary: true };
    }
    onChange(next);
    setDeleteIndex(null);
  };

  return (
    <div className="space-y-4">
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No contacts added yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {contacts.map((contact, index) => (
            <div
              key={index}
              className="rounded-lg border bg-card p-4 shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <UserRound className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {contact.salutation} {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{contact.contactType}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(index)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleteIndex(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>{contact.phone}</p>
                <p className="truncate">{contact.email}</p>
              </div>
              {contact.isPrimary && (
                <Badge variant="secondary" className="w-fit text-xs">
                  Primary Contact
                </Badge>
              )}
              {errors[`contacts.${index}.firstName`] && (
                <p className="text-xs text-destructive">
                  {errors[`contacts.${index}.firstName`]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={openAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Add Contact
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingIndex !== null ? "Edit Contact" : "Add Contact"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Salutation</Label>
              <Select
                value={draft.salutation}
                onValueChange={(v) => setDraft((p) => ({ ...p, salutation: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SALUTATIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name *</Label>
                {draftErrors.firstName && (
                  <p className="text-xs text-destructive">{draftErrors.firstName}</p>
                )}
                <Input
                  value={draft.firstName}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, firstName: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={draft.lastName}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, lastName: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Contact Type</Label>
              <Select
                value={draft.contactType}
                onValueChange={(v) => setDraft((p) => ({ ...p, contactType: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Phone *</Label>
              {draftErrors.phone && (
                <p className="text-xs text-destructive">{draftErrors.phone}</p>
              )}
              <Input
                type="tel"
                value={draft.phone}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    phone: sanitizePhoneInput(e.target.value),
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email *</Label>
              {draftErrors.email && (
                <p className="text-xs text-destructive">{draftErrors.email}</p>
              )}
              <Input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Email Notifications</Label>
              <Switch
                checked={draft.enableEmail}
                onCheckedChange={(v) => setDraft((p) => ({ ...p, enableEmail: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>SMS Notifications</Label>
              <Switch
                checked={draft.enableSms}
                onCheckedChange={(v) => setDraft((p) => ({ ...p, enableSms: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Is Primary</Label>
              <Switch
                checked={draft.isPrimary}
                onCheckedChange={(v) => setDraft((p) => ({ ...p, isPrimary: v }))}
              />
            </div>
          </div>
          <SheetFooter>
            <Button type="button" onClick={saveDraft}>
              {editingIndex !== null ? "Update Contact" : "Add Contact"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteIndex !== null}
        onOpenChange={(open) => !open && setDeleteIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This contact will be removed when you save registration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
