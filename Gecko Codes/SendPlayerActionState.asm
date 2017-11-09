################################################################################
#                      Inject at address 800693dc
# Function is ActionStateChange. It is the main function for making changes to
# action state and is called throughout the Player update process
################################################################################

#replaced code line is executed at the end

################################################################################
#                   subroutine: sendPlayerActionState
# description: gives the inputs of the ActionStateChange function to Slippi
# such that we can play back action transitions
################################################################################
#create stack frame and store link register
mflr r0
stw r0, 0x4(r1)
stwu r1, -0x20(r1)
stw r3, 0x1C(r1)
stw r4, 0x18(r1)

#------------- RUN CONDITIONS -------------
# check scene controller to see if we are in game or in results screen
# if in results screen, skip spawn loading
lis r3, 0x8048
lbz r3, -0x62CD(r3)
cmpwi r3, 0x3
beq- CLEANUP

# initialize transfer with slippi device
bl startExiTransfer

#------------- BEGIN GAME INFO COMMAND -------------
# game information message type
li r3, 0x40
bl sendByteExi

#------------- ACTION ID -------------
# Compute and send frame count (supports negatives before timer starts)
lis r4,0x8048
lwz r4,-0x62A8(r4) # load scene controller frame count
lis r3,0x8047
lwz r3,-0x493C(r3) #load match frame count
cmpwi r3, 0
bne SKIP_FRAME_COUNT_ADJUST #this makes it so that if the timer hasn't started yet, we have a unique frame count still
sub r3,r3,r4
li r4,-0x7B
sub r3,r4,r3

SKIP_FRAME_COUNT_ADJUST:
bl sendWordExi

lbz r3, 0x6C(r30) #loads this player slot
bl sendByteExi

#------------- WRITE BACK INT REGISTERS -------------
lwz r3, 0x18(r1)
bl sendWordExi

mr r3, r5
bl sendWordExi

mr r3, r6
bl sendWordExi

#------------- WRITE BACK FLOAT REGISTERS -------------
stfs f1, 0x14(r1)
lwz r3, 0x14(r1)
bl sendWordExi

stfs f2, 0x14(r1)
lwz r3, 0x14(r1)
bl sendWordExi

stfs f3, 0x14(r1)
lwz r3, 0x14(r1)
bl sendWordExi

bl endExiTransfer

CLEANUP:
#restore registers and sp
lwz r0, 0x24(r1)
lwz r3, 0x1C(r1)
lwz r4, 0x18(r1)
addi r1, r1, 0x20
mtlr r0

b GECKO_END

################################################################################
#                  subroutine: startExiTransfer
#  description: prepares port B exi to be written to
################################################################################
startExiTransfer:
lis r11, 0xCC00 #top bytes of address of EXI registers

#set up EXI
li r10, 0xB0 #bit pattern to set clock to 8 MHz and enable CS for device 0
stw r10, 0x6814(r11) #start transfer, write to parameter register

blr

################################################################################
#                    subroutine: sendByteExi
#  description: sends one byte over port B exi
#  inputs: r3 byte to send
################################################################################
sendByteExi:
slwi r3, r3, 24 #the byte to send has to be left shifted
li r4, 0x5 #bit pattern to write to control register to write one byte
b handleExi

################################################################################
#                    subroutine: sendWordExi
#  description: sends one word over port B exi
#  inputs: r3 word to send
################################################################################
sendWordExi:
li r4, 0x35 #bit pattern to write to control register to write four bytes
b handleExi

################################################################################
#                    subroutine: handleExi
#  description: Handles an exi operation over port B
#  inputs:
#  r3 data to write to transfer register
#  r4 bit pattern for control register
#  outputs:
#  r3 value read from transfer register after operation
################################################################################
handleExi:
#write value in r3 to EXI
stw r3, 0x6824(r11) #store data into transfer register
b handleExiStart

handleExiRetry:
# this effectively calls endExiTransfer and then startExiTransfer again
# the reason for this is on dolphin sometimes I would get an error that read:
# Exception thrown at 0x0000000019E04D6B in Dolphin.exe: 0xC0000005: Access violation reading location 0x000000034BFF6820
# this was causing data to not be written successfully and the only way I found
# to not soft-lock the game (the receive_wait loop would loop forever) was
# to do this
li r10, 0
stw r10, 0x6814(r11) #write 0 to the parameter register
li r10, 0xB0 #bit pattern to set clock to 8 MHz and enable CS for device 0
stw r10, 0x6814(r11) #start transfer, write to parameter register

handleExiStart:
stw r4, 0x6820(r11) #write to control register to begin transfer

li r9, 0
#wait until byte has been transferred
handleExiWait:
addi r9, r9, 1
cmpwi r9, 15
bge- handleExiRetry
lwz r10, 0x6820(r11)
andi. r10, r10, 1
bne handleExiWait

#read values from transfer register to r3 for output
lwz r3, 0x6824(r11) #read from transfer register

blr

################################################################################
#                  subroutine: endExiTransfer
#  description: stops port B writes
################################################################################
endExiTransfer:
li r10, 0
stw r10, 0x6814(r11) #write 0 to the parameter register

blr

GECKO_END:
addi r31, r5, 0 #execute replaced code line
