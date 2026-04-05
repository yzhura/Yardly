"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  getInviteErrorMessage,
  INVITE_ERROR_CODES,
  TEAM_INVITE_UI,
} from "@/constants/team-invite";
import { FormError, FormSuccess } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInviteMember } from "@/hooks/use-invite-member";
import { InviteMutationError } from "@/lib/invite-mutation-error";
import {
  INVITABLE_ROLES,
  organizationRoleLabel,
} from "@/lib/organization-roles";
import {
  teamInviteFormSchema,
  type TeamInviteFormValues,
} from "@/lib/schemas/team-invite";

const defaultValues: TeamInviteFormValues = {
  email: "",
  role: INVITABLE_ROLES[0],
};

export function TeamInviteForm() {
  const [showSuccess, setShowSuccess] = useState(false);
  const invite = useInviteMember();

  const form = useForm<TeamInviteFormValues>({
    resolver: yupResolver(teamInviteFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  useEffect(() => {
    if (invite.isPending) {
      setShowSuccess(false);
    }
  }, [invite.isPending]);

  function onSubmit(values: TeamInviteFormValues) {
    invite.mutate(values, {
      onSuccess: () => {
        form.reset(defaultValues);
        setShowSuccess(true);
      },
    });
  }

  const serverError =
    invite.error instanceof InviteMutationError &&
    invite.error.code !== INVITE_ERROR_CODES.NO_SESSION &&
    invite.error.code !== INVITE_ERROR_CODES.NO_TENANT
      ? getInviteErrorMessage(invite.error.code)
      : null;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <p className="text-sm text-muted-foreground">
          {TEAM_INVITE_UI.helperWhenCanInvite}
        </p>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{TEAM_INVITE_UI.emailLabel}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={TEAM_INVITE_UI.emailPlaceholder}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{TEAM_INVITE_UI.roleLabel}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {INVITABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {organizationRoleLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError ? <FormError>{serverError}</FormError> : null}
        {showSuccess ? (
          <FormSuccess>{TEAM_INVITE_UI.successBanner}</FormSuccess>
        ) : null}

        <Button type="submit" disabled={invite.isPending}>
          {invite.isPending
            ? TEAM_INVITE_UI.submitPending
            : TEAM_INVITE_UI.submit}
        </Button>
      </form>
    </Form>
  );
}
