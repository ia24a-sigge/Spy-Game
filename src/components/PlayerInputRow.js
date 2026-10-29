import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar, IconButton } from './ui';
import { MAX_NAME_LENGTH } from '../lib/validation';
import { colors, font, sizes } from '../theme';

/**
 * One name field in the setup form: number, text input and a button to remove the player.
 * The field turns red and shows the message below if `error` is set.
 * @param {{ index: number, name: string, error: string, inputRef: (el: TextInput | null) => void, onChangeText: (text: string) => void, onBlur: () => void, onRemove: () => void }} props
 */
export default function PlayerInputRow({ index, name, error, inputRef, onChangeText, onBlur, onRemove }) {
  const number = index + 1;
  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <View style={[styles.inputWrap, !!error && styles.inputError]}>
          <Avatar text={String(number)} size={26} fill={colors.primarySoft} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={name}
            onChangeText={onChangeText}
            onBlur={onBlur}
            placeholder="Name eingeben"
            placeholderTextColor={colors.muted}
            maxLength={MAX_NAME_LENGTH + 5}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            accessibilityLabel={`Name Spieler ${number}`}
          />
        </View>
        <IconButton symbol="×" accessibilityLabel={`Spieler ${number} entfernen`} onPress={onRemove} style={styles.remove} />
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: sizes.gap },
  row: { flexDirection: 'row', alignItems: 'center' },
  inputWrap: {
    flex: 1,
    minHeight: sizes.touch + 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingLeft: 10,
  },
  inputError: { borderColor: colors.danger, borderWidth: 1.5 },
  input: { flex: 1, minHeight: sizes.touch, fontSize: font.body + 1, color: colors.text, paddingHorizontal: 10 },
  remove: { marginLeft: sizes.gap, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: font.small, marginTop: 4 },
});
