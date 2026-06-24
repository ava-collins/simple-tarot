import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';

import AvatarImage from '../atoms/avatar-image';
import FormButton from '../atoms/form-button';
import { Value } from '../utils/fonts';
import theme from '../utils/theme';

const t = theme();
const { width, height } = Dimensions.get('window');

export interface UserAccountProps {
    useremail: string;
    logout: () => void;
    resetPassword: () => void;
}

const UserAccount: React.FC<UserAccountProps> = ({
    useremail,
    logout,
    resetPassword
}) => {
    const [isAnon, setAnon] = useState(false);
    useEffect(() => {
        if (useremail) {
            if (useremail.split('@')[1] === 'anon.com') {
                setAnon(true);
            }
        }
    }, [useremail]);

    return (
        <ScrollView>
            <View style={styles.container}>
                <View style={styles.avatar}>
                    <AvatarImage size={254} />
                    <Text style={styles.useremail}>{useremail}</Text>
                </View>
                <View style={styles.anonInfo}>
                    {isAnon && (
                        <Text style={styles.passwordInfo}>
                            Your anonymous login comes with the randomly generated email
                            address above and the password:
                            <Text style={styles.password}>&nbsp;anonymous</Text>
                        </Text>
                    )}
                    {!isAnon && (
                        <FormButton
                            buttonLabel="Reset Password"
                            onPress={resetPassword}
                        />
                    )}
                </View>
                <View style={styles.logoutContainer}>
                    <FormButton
                        buttonLabel="Logout"
                        onPress={logout}
                        buttonStyle={styles.logbtn}
                    />
                </View>
            </View>
        </ScrollView>
    );
};

export default UserAccount;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: height - 100,
        alignItems: 'center',
        marginHorizontal: 40
    },
    avatar: {
        marginTop: 100,
        alignItems: 'center'
    },
    useremail: {
        fontSize: Value(16),
        fontWeight: '600',
        marginVertical: 20,
        alignSelf: 'center'
    },
    anonInfo: {
        paddingHorizontal: 100,
        paddingVertical: 50
    },
    passwordInfo: {
        fontSize: Value(16),
        lineHeight: Value(20),
        fontStyle: 'italic',
        fontWeight: 'normal',
        textAlign: 'center',
        color: t.colors.primary
    },
    password: {
        fontSize: Value(18),
        fontWeight: '600',
        color: t.colors.grey2
    },
    logoutContainer: {
        paddingVertical: 50
    },
    logbtn: {
        backgroundColor: t.colors.grey3
    }
});
