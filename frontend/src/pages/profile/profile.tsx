import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Grid, Skeleton, Typography } from '@mui/material';
import { useForm, FormProvider, SubmitHandler, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../constants/api';
import { profileSchema, ProfileFormValues } from './profileSchema';
import { FormField } from '../../components/profile/FormField';
import { AvatarUploader } from '../../components/profile/AvatarUploader';
import { auth } from '../../firebase_config';
import { useAuth } from '../../context/AuthContext';

export const Profile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const methods = useForm<ProfileFormValues>({
    resolver: yupResolver(profileSchema) as Resolver<ProfileFormValues>,
    mode: 'onChange',
    defaultValues: { avatar: null } as Partial<ProfileFormValues>
  });

  const { handleSubmit, reset, formState } = methods;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const resp = await fetch(`${API_BASE_URL}/api/userProfiles/uid/${user.uid}`);
        if (resp.ok) {
          const data = await resp.json();
          reset({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            username: data.username || '',
            birthDate: data.birthDate || '',
            address: data.address || '',
            phone: data.phone || '',
            language: data.language || '',
            nationality: data.nationality || '',
            gender: data.gender || '',
            interests: data.interests || '',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, reset]);

  const onSubmit: SubmitHandler<ProfileFormValues> = async values => {
    if (!auth.currentUser) return;
    const { avatar, ...payload } = values;
    await fetch(`${API_BASE_URL}/api/userProfiles/uid/${auth.currentUser.uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: auth.currentUser.uid, ...payload })
    });
  };

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3, px: 2, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          {t('profile.title')}
        </Typography>
        {loading ? (
          <Skeleton variant="rectangular" height={400} />
        ) : (
          <>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6">{t('profile.personalData')}</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <FormField name="firstName" label={t('profile.firstName')} control={methods.control} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormField name="lastName" label={t('profile.lastName')} control={methods.control} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormField name="username" label={t('profile.username')} control={methods.control} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormField type="date" name="birthDate" label={t('profile.birthDate')} control={methods.control} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormField
                      name="gender"
                      label={t('profile.gender')}
                      control={methods.control}
                      options={[{ value: 'männlich', label: 'männlich' }, { value: 'weiblich', label: 'weiblich' }]}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <AvatarUploader name="avatar" control={methods.control} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6">{t('profile.contactData')}</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <FormField name="address" label={t('profile.address')} control={methods.control} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormField name="phone" label={t('profile.phone')} control={methods.control} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormField
                      name="nationality"
                      label={t('profile.nationality')}
                      control={methods.control}
                      options={[{ value: 'de', label: 'Deutschland' }, { value: 'tr', label: 'T\u00fcrkei' }]}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormField
                      name="language"
                      label={t('profile.language')}
                      control={methods.control}
                      options={[{ value: 'de', label: 'Deutsch' }, { value: 'en', label: 'Englisch' }]}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">{t('profile.settings')}</Typography>
                <FormField name="interests" label={t('profile.interests')} control={methods.control} multiline rows={3} />
              </CardContent>
            </Card>
          </>
        )}
        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button type="submit" variant="contained" disabled={!formState.isValid || formState.isSubmitting} startIcon={formState.isSubmitting ? <CircularProgress size={20} /> : null}>
            {t('save')}
          </Button>
        </Box>
      </Box>
    </FormProvider>
  );
};
