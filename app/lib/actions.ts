'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Define the schema first
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

// Define the schema for update operations, omitting fields that are not needed
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// Define the schema for creating invoices
const CreateInvoice = FormSchema.omit({ id: true, date: true });

// Function to update an invoice
export async function updateInvoice(id: string, formData: FormData) {
  // Parse form data with the schema
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId') as string,
    amount: parseFloat(formData.get('amount') as string),
    status: formData.get('status') as 'pending' | 'paid',
  });

  // Convert amount to cents
  const amountInCents = amount * 100;

  // Update the invoice in the database
  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  // Revalidate the path and redirect
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// Function to create an invoice
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId') as string,
    amount: parseFloat(formData.get('amount') as string),
    status: formData.get('status') as 'pending' | 'paid',
  });

  // Convert amount to cents
  const amountInCents = amount * 100;

  // Insert the new invoice into the database
  await sql`
    INSERT INTO invoices (customer_id, amount, status)
    VALUES (${customerId}, ${amountInCents}, ${status})
  `;

  // Revalidate the path and redirect
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// Function to delete an invoice
export async function deleteInvoice(id: string) {
  // Delete the invoice from the database
  await sql`
    DELETE FROM invoices
    WHERE id = ${id}
  `;

  // Revalidate the path and redirect
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
