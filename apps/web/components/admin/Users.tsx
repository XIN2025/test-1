'use client';
import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { useGetUsers } from '@/queries/admin';
import { DataLoader } from '../general/DataLoader';
import EmptyMessage from '../general/EmptyMessage';
import { format } from 'date-fns';

const Users = () => {
  const { data: users, isLoading } = useGetUsers();

  if (isLoading) {
    return <DataLoader message='Loading users...' />;
  }

  if (users?.length === 0) {
    return <EmptyMessage message='No users found' description='Check back later for new users.' />;
  }

  return (
    <div className='bg-background mt-4 overflow-hidden rounded-2xl'>
      <div className='flex items-center justify-between p-4'>
        <p className='text-lg font-semibold'>All Users</p>
        <p className='text-muted-foreground text-sm'>{users?.length} users found</p>
      </div>
      <Table className='w-full'>
        <TableCaption className='mb-4'>A list of all users in the system.</TableCaption>
        <TableHeader className='bg-primary/70'>
          <TableRow>
            <TableHead className='px-4'>Name</TableHead>
            <TableHead className='px-4 text-center'>Total Questions</TableHead>
            <TableHead className='px-4 text-center'>Total Tokens Used</TableHead>
            <TableHead className='px-4 text-center'>Avg. Tokens/Question</TableHead>
            <TableHead className='px-4 text-center'>Total Chats</TableHead>
            <TableHead className='px-4 text-center'>Joined On</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => {
            const avgTokensPerQuestion = user?.chatStats?.totalTokensUsed
              ? Number((user?.chatStats?.totalTokensUsed / user?.chatStats?.totalQuestions).toFixed(2)).toLocaleString()
              : 0;
            const totalChats = Number(user?.chatStats?.totalChats || 0).toLocaleString();
            const totalQuestions = Number(user?.chatStats?.totalQuestions || 0).toLocaleString();
            const totalTokensUsed = Number(user?.chatStats?.totalTokensUsed || 0).toLocaleString();
            return (
              <TableRow key={user.id}>
                <TableCell className='px-4 py-4'>{user.name}</TableCell>
                <TableCell className='px-4 py-4 text-center'>{totalQuestions}</TableCell>
                <TableCell className='px-4 py-4 text-center'>{totalTokensUsed}</TableCell>
                <TableCell className='px-4 py-4 text-center'>{avgTokensPerQuestion}</TableCell>
                <TableCell className='px-4 py-4 text-center'>{totalChats}</TableCell>
                <TableCell className='px-4 py-4 text-center'>{format(user.createdAt, 'dd MMM yyyy')}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default Users;
