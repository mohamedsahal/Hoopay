import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { documentTypes } from '../../constants/kycData';

interface DocumentTypePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (documentType: string) => void;
  selectedType?: string;
}

const DocumentTypePickerModal: React.FC<DocumentTypePickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedType,
}) => {
  const { colors } = useTheme();

  const handleSelect = (type: { value: string; label: string }) => {
    onSelect(type.value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.background }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Document Type
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {documentTypes.map((docType) => (
            <TouchableOpacity
              key={docType.value}
              style={[styles.pickerItem, { borderBottomColor: colors.border }]}
              onPress={() => handleSelect(docType)}
            >
              <Text style={[styles.pickerItemText, { color: colors.text }]}>
                {docType.label}
              </Text>
              {selectedType === docType.value && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 20,
    paddingTop: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 16,
  },
});

export default DocumentTypePickerModal; 