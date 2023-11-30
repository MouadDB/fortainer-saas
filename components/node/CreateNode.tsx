import { defaultHeaders } from '@/lib/common';
import type { Node } from '@prisma/client';
import { useFormik } from 'formik';
import useNodes from 'hooks/useNodes';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import React from 'react';
import { Button } from 'react-daisyui';
import toast from 'react-hot-toast';
import type { ApiResponse } from 'types';
import * as Yup from 'yup';
import Modal from '../shared/Modal';
import { InputWithLabel } from '../shared';

interface CreateNodeProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const CreateNode = ({ visible, setVisible }: CreateNodeProps) => {
  const { t } = useTranslation('common');
  const { mutateNodes } = useNodes();
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      name: '',
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required(),
    }),
    onSubmit: async (values) => {
      const response = await fetch('/api/nodes/', {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(values),
      });

      const json = (await response.json()) as ApiResponse<Node>;

      if (!response.ok) {
        toast.error(json.error.message);
        return;
      }

      formik.resetForm();
      mutateNodes();
      setVisible(false);
      toast.success(t('node-created'));
      router.push(`/nodes/${json.data.slug}/settings`);
    },
  });

  const onClose = () => {
    setVisible(false);
    router.push(`/nodes`);
  };

  return (
    <Modal open={visible} close={onClose}>
      <form onSubmit={formik.handleSubmit} method="POST">
        <Modal.Header>{t('create-node')}</Modal.Header>
        <Modal.Description>{t('members-of-a-node')}</Modal.Description>
        <Modal.Body>
          <InputWithLabel
            label={t('name')}
            name="name"
            onChange={formik.handleChange}
            value={formik.values.name}
            placeholder={t('node-name')}
            required
          />
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline" onClick={onClose} size="md">
            {t('close')}
          </Button>
          <Button
            type="submit"
            color="primary"
            loading={formik.isSubmitting}
            size="md"
            disabled={!formik.dirty || !formik.isValid}
          >
            {t('create-node')}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default CreateNode;
