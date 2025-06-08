import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface AdminFeedbackProps {
  kycStatus: any;
  onResubmit: () => void;
  onBackToSteps: () => void;
  isSubmitting: boolean;
}

const AdminFeedback: React.FC<AdminFeedbackProps> = ({
  kycStatus,
  onResubmit,
  onBackToSteps,
  isSubmitting,
}) => {
  const { colors } = useTheme();

  // Debug logging to check what data we're receiving
  console.log('🔍 AdminFeedback Debug:', {
    kycStatus_full: kycStatus,
    admin_feedback: kycStatus?.admin_feedback,
    verification_status: kycStatus?.verification_status,
    rejection_reason_direct: kycStatus?.rejection_reason,
  });

  const adminFeedback = kycStatus?.admin_feedback;
  const rejectionReason = adminFeedback?.rejection_reason || 
                         adminFeedback?.reason || 
                         adminFeedback?.feedback || 
                         adminFeedback?.message || 
                         kycStatus?.rejection_reason || // Fallback to direct field
                         'No specific reason provided';
  
  const adminComments = adminFeedback?.admin_comments || 
                       adminFeedback?.comments || 
                       '';
  
  const rejectedAt = adminFeedback?.rejected_at || kycStatus?.reviewed_at;
  const adminName = adminFeedback?.admin_name || adminFeedback?.reviewer_name;
  const specificIssues = adminFeedback?.specific_issues || [];

  console.log('🔍 AdminFeedback Parsed Data:', {
    rejectionReason,
    adminComments,
    rejectedAt,
    adminName,
    specificIssues
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[
        styles.rejectionCard, 
        { 
          backgroundColor: colors.errorBackground || colors.card, 
          borderColor: colors.error || colors.primary,
          shadowColor: colors.shadow
        }
      ]}>
        <View style={styles.rejectionHeader}>
          <View style={styles.rejectionHeaderIcon}>
            <Ionicons name="close-circle" size={24} color={colors.error || colors.primary} />
          </View>
          <View style={styles.rejectionHeaderText}>
            <Text style={[styles.rejectionTitle, { color: colors.error || colors.primary }]}>
              Application Rejected
            </Text>
            <Text style={[styles.rejectionSubtitle, { color: colors.textSecondary || colors.text }]}>
              Please review the feedback and resubmit
            </Text>
          </View>
        </View>

        <View style={styles.feedbackSection}>
          <Text style={[styles.feedbackLabel, { color: colors.text }]}>
            Rejection Reason:
          </Text>
          <Text style={[styles.feedbackText, { color: colors.text }]}>
            {rejectionReason}
          </Text>
        </View>

        {adminComments && (
          <View style={styles.feedbackSection}>
            <Text style={[styles.feedbackLabel, { color: colors.text }]}>
              Admin Comments:
            </Text>
            <Text style={[styles.feedbackText, { color: colors.text }]}>
              {adminComments}
            </Text>
          </View>
        )}

        {specificIssues.length > 0 && (
          <View style={styles.feedbackSection}>
            <Text style={[styles.feedbackLabel, { color: colors.text }]}>
              Specific Issues:
            </Text>
            {specificIssues.map((issue: any, index: number) => (
              <View key={index} style={styles.issueItem}>
                <Ionicons name="alert-circle" size={16} color={colors.warning || colors.error || colors.primary} />
                <View style={styles.issueText}>
                  <Text style={[styles.issueDocumentType, { color: colors.text }]}>
                    {issue.document_type}:
                  </Text>
                  <Text style={[styles.issueDescription, { color: colors.text }]}>
                    {issue.issue}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.metaInfo, { borderTopColor: colors.border }]}>
          {rejectedAt && (
            <Text style={[styles.metaText, { color: colors.textSecondary || colors.text }]}>
              Rejected on: {new Date(rejectedAt).toLocaleDateString()}
            </Text>
          )}
          {adminName && (
            <Text style={[styles.metaText, { color: colors.textSecondary || colors.text }]}>
              Reviewed by: {adminName}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actionSection}>
        <Text style={[styles.actionTitle, { color: colors.text }]}>
          What's Next?
        </Text>
        <Text style={[styles.actionDescription, { color: colors.textSecondary || colors.text }]}>
          Review the feedback above and make the necessary corrections to your application.
        </Text>

        <TouchableOpacity
          style={[
            styles.actionButton, 
            { 
              backgroundColor: colors.success || colors.primary,
              shadowColor: colors.shadow 
            }
          ]}
          onPress={onResubmit}
          disabled={isSubmitting}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.actionButtonText}>
            {isSubmitting ? 'Resubmitting...' : 'Fix Issues & Resubmit'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={onBackToSteps}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            Back to KYC Steps
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  rejectionCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rejectionHeaderIcon: {
    marginRight: 12,
  },
  rejectionHeaderText: {
    flex: 1,
  },
  rejectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rejectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  feedbackSection: {
    marginBottom: 16,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  issueText: {
    flex: 1,
    marginLeft: 8,
  },
  issueDocumentType: {
    fontSize: 14,
    fontWeight: '600',
  },
  issueDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  metaInfo: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  actionSection: {
    marginBottom: 24,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 14,
    marginBottom: 20,
    opacity: 0.7,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AdminFeedback; 