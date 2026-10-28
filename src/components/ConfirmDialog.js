import { Modal, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './ui';
import { colors, font, sizes } from '../theme';

export default function ConfirmDialog({ visible, title, message, cancelTitle, confirmTitle, onCancel, onConfirm }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <PrimaryButton title={cancelTitle} onPress={onCancel} />
          <PrimaryButton title={confirmTitle} variant="danger" onPress={onConfirm} style={{ marginTop: sizes.gap }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 400, backgroundColor: colors.surface, borderRadius: 24, padding: 22 },
  title: { fontSize: font.heading + 2, color: colors.text, textAlign: 'center' },
  message: { fontSize: font.small + 1, color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 20 },
});
