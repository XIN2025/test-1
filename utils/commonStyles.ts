export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
};

export const commonStylesLight = {
  pressableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    ...shadow.card,
  },
  displayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0,
    ...shadow.card,
  },
};

export const commonStylesDark = {
  pressableCard: {
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 16,
  },
  displayCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
};
