import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { MinimalTiptapEditor } from '@/components/tiptap';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { useListingForm } from '../../../hooks';
import { Templates } from './Templates';

export function DescriptionAndTemplate() {
  const form = useListingForm();
  const templateId = useWatch({
    control: form.control,
    name: 'templateId',
  });

  const editorKey = useMemo(
    () => `editor-${templateId || 'default'}`,
    [templateId],
  );
  const posthog = usePostHog();

  return (
    <FormField
      name="description"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem className="gap-2">
            <div className="flex items-center justify-between">
              <FormLabel isRequired>Description</FormLabel>
              <div className="flex items-center gap-2">
                <Templates />
                <Button
                  asChild
                  className="ph-no-capture h-8 bg-transparent p-0 shadow-none"
                  onClick={() => {
                    posthog.capture('AI bot_sponsor');
                    toast.info(
                      `Heads up! If you have the ChatGPT desktop app, the link might have opened there. Otherwise, it'll open in your browser.`,
                    );
                  }}
                >
                  <Link
                    href="https://chat.openai.com/g/g-HS6eWTMku-st-earn-listings-bot"
                    target="_blank"
                    className="ph-no-capture"
                  >
                    <div className="group bg-background relative inline-flex h-full overflow-hidden rounded-[calc(1.5px+0.375rem-2px)] p-[1.5px] pb-[1.8px] focus:outline-hidden">
                      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#FF79C1_0%,#76C5FF_50%,#FF79C1_100%)]" />
                      <span className="ph-no-capture bg-background inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-1 text-xs font-medium text-slate-500 backdrop-blur-3xl group-hover:bg-slate-50">
                        <img
                          src="/assets/ai-wand.svg"
                          alt="Auto Generate GPT"
                        />
                        Auto Generate
                      </span>
                    </div>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="ring-primary flex rounded-md border has-focus:ring-1">
              <FormControl>
                <MinimalTiptapEditor
                  key={editorKey}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e);
                    form.saveDraft();
                  }}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="min-h-[60vh] w-full border-0 text-sm"
                  editorContentClassName="p-4 px-2 h-full"
                  output="html"
                  placeholder="Type your description here..."
                  editable={true}
                  editorClassName="focus:outline-hidden"
                  imageSetting={{
                    folderName: 'listing-description',
                    type: 'description',
                  }}
                  toolbarClassName="sticky top-0 bg-white z-10"
                />
              </FormControl>
            </div>
            <FormMessage className="ml-auto w-fit" />
          </FormItem>
        );
      }}
    />
  );
}
