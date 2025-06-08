import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onDateChange: (date: string) => void;
  dateFields: { day: string; month: string; year: string };
  onFieldChange: (field: 'day' | 'month' | 'year', value: string) => void;
  focusedField: 'day' | 'month' | 'year' | null;
  onFieldFocus: (field: 'day' | 'month' | 'year') => void;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onDateChange,
  dateFields,
  onFieldChange,
  focusedField,
  onFieldFocus,
}) => {
  const { colors } = useTheme();

  const validateAndSetDate = () => {
    const { day, month, year } = dateFields;
    
    if (day && month && year) {
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (dayNum >= 1 && dayNum <= 31 && 
          monthNum >= 1 && monthNum <= 12 && 
          yearNum >= 1900 && yearNum <= new Date().getFullYear()) {
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        onDateChange(formattedDate);
        onClose();
      }
    }
  };

  const handleClose = () => {
    onClose();
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            <SafeAreaView style={styles.safeArea}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Enter Date of Birth
                  </Text>
                  <TouchableOpacity onPress={handleClose}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.dateScrollContainer}>
                  <View style={styles.datePickerContainer}>
                    <Text style={[styles.datePickerLabel, { color: colors.text }]}>
                      Enter your date of birth
                    </Text>
                    
                    <View style={styles.dateInputContainer}>
                      <View style={styles.dateFieldContainer}>
                        <Text style={[styles.dateFieldLabel, { color: colors.text }]}>Day</Text>
                        <TextInput
                          style={[
                            styles.dateField,
                            {
                              backgroundColor: colors.background,
                              color: colors.text,
                              borderColor: focusedField === 'day' ? colors.primary : colors.border,
                            }
                          ]}
                          value={dateFields.day}
                          onChangeText={(text) => onFieldChange('day', text)}
                          onFocus={() => onFieldFocus('day')}
                          placeholder="DD"
                          placeholderTextColor="#999"
                          keyboardType="numeric"
                          maxLength={2}
                          textAlign="center"
                        />
                      </View>
                      
                      <View style={styles.dateFieldContainer}>
                        <Text style={[styles.dateFieldLabel, { color: colors.text }]}>Month</Text>
                        <TextInput
                          style={[
                            styles.dateField,
                            {
                              backgroundColor: colors.background,
                              color: colors.text,
                              borderColor: focusedField === 'month' ? colors.primary : colors.border,
                            }
                          ]}
                          value={dateFields.month}
                          onChangeText={(text) => onFieldChange('month', text)}
                          onFocus={() => onFieldFocus('month')}
                          placeholder="MM"
                          placeholderTextColor="#999"
                          keyboardType="numeric"
                          maxLength={2}
                          textAlign="center"
                        />
                      </View>
                      
                      <View style={styles.dateFieldContainer}>
                        <Text style={[styles.dateFieldLabel, { color: colors.text }]}>Year</Text>
                        <TextInput
                          style={[
                            styles.dateField,
                            {
                              backgroundColor: colors.background,
                              color: colors.text,
                              borderColor: focusedField === 'year' ? colors.primary : colors.border,
                            }
                          ]}
                          value={dateFields.year}
                          onChangeText={(text) => onFieldChange('year', text)}
                          onFocus={() => onFieldFocus('year')}
                          placeholder="YYYY"
                          placeholderTextColor="#999"
                          keyboardType="numeric"
                          maxLength={4}
                          textAlign="center"
                        />
                      </View>
                    </View>

                    {dateFields.day && dateFields.month && dateFields.year && (
                      <View style={[styles.datePreviewContainer, { backgroundColor: colors.background }]}>
                        <Ionicons name="calendar" size={16} color={colors.primary} />
                        <Text style={[styles.datePreview, { color: colors.text }]}>
                          {`${dateFields.year}-${dateFields.month.padStart(2, '0')}-${dateFields.day.padStart(2, '0')}`}
                        </Text>
                      </View>
                    )}
                  </View>
                </ScrollView>

                <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={[styles.doneButton, { backgroundColor: colors.primary }]}
                    onPress={validateAndSetDate}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  safeArea: {
    maxHeight: '85%',
    minHeight: '50%',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dateScrollContainer: {
    flex: 1,
  },
  datePickerContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  datePickerLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  dateFieldContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  dateField: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 15 : 12,
    fontSize: 16,
    minHeight: Platform.OS === 'ios' ? 44 : 40,
  },
  datePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  datePreview: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalFooter: {
    borderTopWidth: 1,
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DatePickerModal; 