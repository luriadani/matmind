import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../components/Localization';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Up to 7 techniques',
      'Basic training schedule',
      'Hebrew & English support',
      'Basic notifications'
    ],
    limitations: [
      'Techniques will be deleted after limit',
      'No advanced features',
      'No gym sharing'
    ],
    color: '#6B7280'
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$9.99',
    period: 'per month',
    features: [
      'Unlimited techniques',
      'Advanced training schedule',
      'Custom categories',
      'Gym sharing',
      'Advanced notifications',
      'Priority support'
    ],
    popular: true,
    color: '#2563EB'
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$199',
    period: 'one-time',
    features: [
      'Everything in Monthly',
      'Lifetime access',
      'Future updates included',
      'Premium support',
      'Early access to features'
    ],
    color: '#DC2626'
  }
];

export default function Pricing() {
  const { t } = useAppContext();
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = () => {
    // In a real app, this would handle payment processing
    console.log('Subscribing to plan:', selectedPlan);
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('pricing.title')}</Text>
        <Text style={styles.subtitle}>{t('pricing.subtitle')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.plansContainer}>
          {plans.map(plan => (
            <View 
              key={plan.id} 
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular
              ]}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>{t('pricing.most_popular')}</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.planPrice}>
                  <Text style={styles.price}>{plan.price}</Text>
                  <Text style={styles.period}>{plan.period}</Text>
                </View>
              </View>

              <View style={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {plan.limitations && (
                <View style={styles.limitationsList}>
                  {plan.limitations.map((limitation, index) => (
                    <View key={index} style={styles.limitationItem}>
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                      <Text style={styles.limitationText}>{limitation}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  selectedPlan === plan.id && styles.selectButtonSelected,
                  { borderColor: plan.color }
                ]}
                onPress={() => handleSelectPlan(plan.id)}
              >
                <Text style={[
                  styles.selectButtonText,
                  selectedPlan === plan.id && styles.selectButtonTextSelected
                ]}>
                  {selectedPlan === plan.id ? t('pricing.selected') : t('pricing.select')}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.subscribeButton}
            onPress={handleSubscribe}
          >
            <Text style={styles.subscribeButtonText}>
              {t('pricing.subscribe_now')}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.termsText}>
            {t('pricing.terms_text')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 20,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  planCardPopular: {
    borderColor: '#2563EB',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  planPrice: {
    alignItems: 'center',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  period: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
  },
  limitationsList: {
    marginBottom: 16,
  },
  limitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitationText: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 8,
  },
  selectButton: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  selectButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButtonTextSelected: {
    color: 'white',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  subscribeButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  termsText: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
}); 