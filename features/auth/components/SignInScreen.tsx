import { DumbbellIcon } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';

import { useSignInForm } from '../hooks/useAuth';

export function SignInScreen() {
  const { submit, submitting, error, clearError } = useSignInForm();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isSignIn = mode === 'signIn';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-center bg-background p-6">
      <View className="mb-8 items-center gap-2">
        <View className="rounded-2xl bg-primary p-4">
          <Icon as={DumbbellIcon} className="size-8 text-primary-foreground" />
        </View>
        <Text className="text-3xl font-bold">FitLog</Text>
        <Text className="text-muted-foreground">운동을 기록하고 성장을 확인하세요</Text>
      </View>

      <Card>
        <CardHeader>
          <CardTitle>{isSignIn ? '로그인' : '회원가입'}</CardTitle>
          <CardDescription>이메일과 비밀번호를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <View className="gap-1.5">
            <Label nativeID="email">이메일</Label>
            <Input
              aria-labelledby="email"
              testID="email-input"
              value={email}
              onChangeText={(t) => (setEmail(t), clearError())}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
          <View className="gap-1.5">
            <Label nativeID="password">비밀번호</Label>
            <Input
              aria-labelledby="password"
              testID="password-input"
              value={password}
              onChangeText={(t) => (setPassword(t), clearError())}
              placeholder="6자 이상"
              secureTextEntry
            />
          </View>
          {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
          <Button
            size="lg"
            testID="auth-submit"
            disabled={submitting}
            onPress={() => submit(mode, { email, password })}>
            <Text>{submitting ? '잠시만요…' : isSignIn ? '로그인' : '가입하고 시작하기'}</Text>
          </Button>
          <Button
            variant="ghost"
            testID="auth-mode-toggle"
            onPress={() => (setMode(isSignIn ? 'signUp' : 'signIn'), clearError())}>
            <Text>{isSignIn ? '계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인'}</Text>
          </Button>
        </CardContent>
      </Card>
    </KeyboardAvoidingView>
  );
}
