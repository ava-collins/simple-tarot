import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import mdx from './avatar-rollback.mdx';
import AvatarRollback from './avatar-rollback';
import { avatarImagesMock } from '../tests/mocks/avatarImages';
import { http, HttpResponse } from 'msw';

const meta = {
    title: 'Atoms/Rollback/AvatarRollback',
    component: AvatarRollback,
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
} satisfies Meta<typeof AvatarRollback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LegacyRestMockPath: Story = {
    args: {
        apiBaseUrl: 'http://localhost:4100',
        size: 200
    }
};

export const SavedImageRollback: Story = {
    args: {
        apiBaseUrl: 'http://localhost:4100',
        size: 200,
        saved: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6O28sJnpWVa7ONm0YzlatnXK8T_jfJg3HTgKykcn7wQ&s'
    }
};
