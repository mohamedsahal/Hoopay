import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Modal, 
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const ImageViewer = ({
  visible,
  imageUrl,
  imageTitle,
  insets,
  downloadingImage,
  sharingImage,
  onClose,
  onDownload,
  onShare
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.imageViewerContainer}>
        {/* Background overlay */}
        <TouchableOpacity 
          style={styles.imageViewerBackground}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.imageViewerContent}>
            {/* Header */}
            <View style={[styles.imageViewerHeader, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity 
                style={styles.imageViewerCloseButton}
                onPress={onClose}
              >
                <MaterialIcons name="close" size={28} color="white" />
              </TouchableOpacity>
              {imageTitle && (
                <Text style={styles.imageViewerTitle} numberOfLines={2}>
                  {imageTitle}
                </Text>
              )}
            </View>

            {/* Image */}
            <View style={styles.imageViewerImageContainer}>
              {imageUrl ? (
                <Image 
                  source={{ uri: imageUrl }}
                  style={styles.imageViewerImage}
                  resizeMode="contain"
                  onError={(error) => {
                    console.error('Failed to load image in viewer:', error);
                    Alert.alert('Error', 'Failed to load image');
                    onClose();
                  }}
                />
              ) : (
                <View style={styles.imageViewerPlaceholder}>
                  <MaterialIcons name="broken-image" size={64} color="white" />
                  <Text style={styles.imageViewerPlaceholderText}>Failed to load image</Text>
                </View>
              )}
            </View>

            {/* Footer with actions */}
            <View style={styles.imageViewerFooter}>
              <TouchableOpacity 
                style={[
                  styles.imageViewerActionButton,
                  downloadingImage && styles.imageViewerActionButtonLoading
                ]}
                onPress={onDownload}
                disabled={downloadingImage || sharingImage}
              >
                {downloadingImage ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialIcons name="download" size={24} color="white" />
                )}
                <Text style={styles.imageViewerActionText}>
                  {downloadingImage ? 'Downloading...' : 'Download'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.imageViewerActionButton,
                  sharingImage && styles.imageViewerActionButtonLoading
                ]}
                onPress={onShare}
                disabled={downloadingImage || sharingImage}
              >
                {sharingImage ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialIcons name="share" size={24} color="white" />
                )}
                <Text style={styles.imageViewerActionText}>
                  {sharingImage ? 'Sharing...' : 'Share'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = {
  // Image Viewer Styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageViewerBackground: {
    flex: 1,
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 1,
  },
  imageViewerCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  imageViewerTitle: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  imageViewerImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  imageViewerImage: {
    width: '100%',
    height: '100%',
    maxWidth: screenWidth,
    maxHeight: '80%',
  },
  imageViewerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  imageViewerPlaceholderText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  imageViewerFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 40,
  },
  imageViewerActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
  },
  imageViewerActionButtonLoading: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.7,
  },
  imageViewerActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
};

export default ImageViewer; 