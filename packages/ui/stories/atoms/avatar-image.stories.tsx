import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import mdx from './avatar-image.mdx';
import AvatarImage from './avatar-image';
import React from 'react';
import { avatarImagesMock } from '../tests/mocks/avatarImages';
import { http, HttpResponse } from 'msw';

const meta = {
    title: 'Atoms/Avatar',
    component: AvatarImage,
    parameters: {
        docs: {
            page: mdx
        },
        msw: {
            handlers: [
                http.get('http://localhost:4100/avatars', () =>
                    HttpResponse.json(avatarImagesMock, {
                        status: 200
                    })
                )
            ]
        }
    }
} satisfies Meta<typeof AvatarImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        apiBaseUrl: 'http://localhost:4100',
        size: 200
    }
};

export const Saved: Story = {
    args: {
        apiBaseUrl: 'http://localhost:4100',
        size: 200,
        saved: 'https://serpapi.com/searches/6843526b69819df7ebec89f8/images/0a5f0bc6c789c9f1378c8240989ad89fa4198ddb662d316731ef3f377ba16ae0.jpeg'
    }
};
