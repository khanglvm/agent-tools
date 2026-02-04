/**
 * Shared prompt utilities
 */

import * as p from '@clack/prompts';

interface SelectItem {
    value: string;
    label: string;
    hint?: string;
}

/**
 * Multi-select with instructions for toggle all.
 * 
 * Built-in keyboard shortcuts (from @clack/core):
 * - Press 'a' to toggle all items
 * - Press 'i' to invert selection
 * - Space to toggle current item
 * - Enter to submit
 */
export async function multiselectWithAll(opts: {
    message: string;
    items: SelectItem[];
    required?: boolean;
}): Promise<string[] | null> {
    const { message, items, required = true } = opts;

    if (items.length === 0) {
        return [];
    }

    // Show hint about keyboard shortcuts (available in @clack/core 1.0.0+)
    const messageWithHint = `${message} (space: toggle, a: all, i: invert)`;

    const selected = await p.multiselect({
        message: messageWithHint,
        options: items,
        required,
    });

    if (p.isCancel(selected)) {
        return null;
    }

    return selected as string[];
}
